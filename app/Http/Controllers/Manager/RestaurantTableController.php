<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\RestaurantTable;
use App\Models\TableSection;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\SvgWriter;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class RestaurantTableController extends Controller
{
    /**
     * Display all restaurant tables.
     */
    public function index()
    {
        $tables = RestaurantTable::query()
            ->with('section')
            ->latest()
            ->get();

        $sections = TableSection::where('status', 'active')->get();

        return Inertia::render('manager/tables/index', [
            'tables' => $tables,
            'sections' => $sections,
        ]);
    }

    /**
     * Show the form for creating a new table.
     *
     * We are using a modal on the index page,
     * so this method is not required for the UI.
     */
    public function create()
    {
        return redirect()->route('manager.tables.index');
    }

    /**
     * Store a newly created table.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'table_number' => [
                'required',
                'integer',
                'min:1',
                'max:65535',
                Rule::unique('restaurant_tables', 'table_number')
                    ->where(fn ($query) => $query->where('branch_id', Branch::current()?->id)),
            ],
            'qr_code' => [
                'nullable',
                'string',
                'max:255',
                'unique:restaurant_tables,qr_code',
            ],
            'table_section_id' => [
                'nullable',
                'exists:table_sections,id',
            ],
        ]);

        $qrPath = null;
        if (!empty($validated['qr_code'])) {
            $qrPath = $validated['qr_code'];
        } else {
            try {
                $qrPath = $this->generateQrCode((int) $validated['table_number'], Branch::current()?->id);
            } catch (\Exception $e) {
                Log::error('QR code generation failed for table #' . $validated['table_number'], [
                    'error' => $e->getMessage(),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                    'table_number' => $validated['table_number'],
                    'menu_url' => route('menu.customer', ['table' => $validated['table_number']]),
                ]);

                return back()->withErrors([
                    'table_number' => 'Failed to generate QR code for this table. Please check server configuration and try again.',
                ])->withInput();
            }
        }

        RestaurantTable::create([
            'branch_id' => Branch::current()?->id,
            'table_section_id' => $validated['table_section_id'] ?? null,
            'table_number' => $validated['table_number'],
            'qr_code' => $qrPath,
            'status' => 'available',
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Restaurant table created successfully.',
        ]);

        return back();
    }

    /**
     * Display the specified table.
     *
     * We are using a modal on the index page,
     * so this method is not required for the UI.
     */
    public function show(RestaurantTable $table)
    {
        return redirect()->route('manager.tables.index');
    }

    /**
     * Show the form for editing the specified table.
     *
     * We are using a modal on the index page,
     * so this method is not required for the UI.
     */
    public function edit(RestaurantTable $table)
    {
        return redirect()->route('manager.tables.index');
    }

    /**
     * Generate a QR code image that points to the customer menu
     * with the given table number pre-assigned.
     *
     * @throws \RuntimeException
     */
    protected function generateQrCode(int $tableNumber, ?int $branchId = null): string
    {
        // Generate QR code pointing directly to the customer menu with the table pre-assigned.
        // Customers who scan this will go straight to the menu, bypassing table selection.
        $menuUrl = route('menu.customer', [
            'table' => $tableNumber,
            'branch' => $branchId,
        ]);

        // Validate that the generated URL is not empty and the route exists
        if (empty($menuUrl) || !filter_var($menuUrl, FILTER_VALIDATE_URL)) {
            throw new \RuntimeException('Generated menu URL is invalid: ' . ($menuUrl ?: 'empty'));
        }

        // Ensure the qrcodes storage directory exists
        $qrcodeDir = 'qrcodes';
        if (!Storage::disk('public')->exists($qrcodeDir)) {
            Storage::disk('public')->makeDirectory($qrcodeDir);
        }

        $qrCode = new QrCode($menuUrl);
        $writer = new SvgWriter();
        $result = $writer->write($qrCode);

        $fileName = $qrcodeDir . '/table_' . $tableNumber . '_' . uniqid('qr_', true) . '.svg';
        $saved = Storage::disk('public')->put($fileName, $result->getString());

        if ($saved === false) {
            throw new \RuntimeException('Failed to save QR code image to storage.');
        }

        return $fileName;
    }

    /**
     * Regenerate the QR code for a table so it points to the customer menu.
     */
    public function regenerateQr(Request $request, RestaurantTable $table)
    {
        try {
            // Delete the existing QR code image if it is stored on disk
            if ($table->qr_code && Storage::disk('public')->exists($table->qr_code)) {
                Storage::disk('public')->delete($table->qr_code);
            }

            $qrPath = $this->generateQrCode($table->table_number, $table->branch_id);

            $table->update([
                'qr_code' => $qrPath,
            ]);

            Inertia::flash('toast', [
                'type' => 'success',
                'message' => 'QR code regenerated successfully for Table ' . $table->table_number . '.',
            ]);
        } catch (\Exception $e) {
            Log::error('QR code regeneration failed for table #' . $table->table_number, [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'table_number' => $table->table_number,
            ]);

            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Failed to regenerate QR code for this table.',
            ]);
        }

        return back();
    }

    /**
     * Update the specified table.
     */
    public function update(
        Request $request,
        RestaurantTable $table
    ) {
        $validated = $request->validate([
            'table_number' => [
                'required',
                'integer',
                'min:1',
                'max:65535',
                Rule::unique('restaurant_tables', 'table_number')
                    ->where(fn ($query) => $query->where('branch_id', Branch::current()?->id))
                    ->ignore($table->id),
            ],
            'qr_code' => [
                'nullable',
                'string',
                'max:255',
                'unique:restaurant_tables,qr_code,' . $table->id,
            ],
            'table_section_id' => [
                'nullable',
                'exists:table_sections,id',
            ],
        ]);

        $table->update([
            'branch_id' => Branch::current()?->id,
            'table_section_id' => $validated['table_section_id'] ?? null,
            'table_number' => $validated['table_number'],
            'qr_code' => $validated['qr_code']
                ?? $table->qr_code,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Restaurant table updated successfully.',
        ]);

        return back();
    }

    /**
     * Remove the specified table.
     */
    public function destroy(RestaurantTable $table)
    {
        if ($table->status !== 'available') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'You cannot delete a table that is currently occupied.',
            ]);

            return back();
        }

        if ($table->qr_code && Storage::disk('public')->exists($table->qr_code)) {
            Storage::disk('public')->delete($table->qr_code);
        }

        $table->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Restaurant table deleted successfully.',
        ]);

        return back();
    }

    /**
     * Toggle the status of a table (available <-> occupied).
     */
    public function toggleStatus(RestaurantTable $table)
    {
        if ($table->status === 'awaiting_payment') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Cannot manually change status of a table awaiting payment.',
            ]);

            return back();
        }

        $table->update([
            'status' => $table->status === 'available' ? 'occupied' : 'available',
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Table status updated successfully.',
        ]);

        return back();
    }
}
