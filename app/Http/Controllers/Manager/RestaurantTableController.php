<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\SvgWriter;
use Illuminate\Validation\Rule;

class RestaurantTableController extends Controller
{
    /**
     * Get the currently selected branch ID.
     */
    private function currentBranchId(Request $request): int
    {
        $branchId = $request->session()->get('current_branch_id');

        if (! $branchId) {
            abort(400, 'No branch selected.');
        }

        return (int) $branchId;
    }

    /**
     * Display all restaurant tables
     * belonging to the currently selected branch.
     */
    public function index(Request $request)
    {
        $branchId = $this->currentBranchId($request);

        $tables = RestaurantTable::query()
            ->where('branch_id', $branchId)
            ->latest()
            ->get();

        return Inertia::render('manager/tables/index', [
            'tables' => $tables,
        ]);
    }

    /**
     * Show the form for creating a new table.
     *
     * We are using a modal on the index page,
     * so this method is not required for the UI.
     */
    public function create(Request $request)
    {
        $this->currentBranchId($request);

        return redirect()->route('manager.tables.index');
    }

    /**
     * Store a newly created table
     * in the currently selected branch.
     */
    public function store(Request $request)
    {
        $branchId = $this->currentBranchId($request);

        $validated = $request->validate([
            'table_number' => [
                'required',
                'integer',
                'min:1',
                'max:65535',

                // Table numbers only need to be unique
                // inside the current branch.
                Rule::unique('restaurant_tables', 'table_number')
                    ->where(function ($query) use ($branchId) {
                        return $query->where(
                            'branch_id',
                            $branchId
                        );
                    }),
            ],

            'qr_code' => [
                'nullable',
                'string',
                'max:255',

                // QR code path must also be unique.
                'unique:restaurant_tables,qr_code',
            ],
        ]);

        $qrPath = null;

        if (! empty($validated['qr_code'])) {
            $qrPath = $validated['qr_code'];
        } else {
            try {
                /*
                |--------------------------------------------------------------------------
                | Generate QR Code
                |--------------------------------------------------------------------------
                |
                | The table number is unique inside the selected branch.
                | We also pass the branch ID so the menu can identify
                | which branch the customer is ordering from.
                |
                */

                $menuUrl = route('menu.index', [
                    'table' => $validated['table_number'],
                    'branch' => $branchId,
                ]);

                // Validate generated URL.
                if (
                    empty($menuUrl) ||
                    ! filter_var(
                        $menuUrl,
                        FILTER_VALIDATE_URL
                    )
                ) {
                    throw new \RuntimeException(
                        'Generated menu URL is invalid: ' .
                        ($menuUrl ?: 'empty')
                    );
                }

                // Ensure QR code directory exists.
                $qrcodeDir = 'qrcodes';

                if (
                    ! Storage::disk('public')
                        ->exists($qrcodeDir)
                ) {
                    Storage::disk('public')
                        ->makeDirectory($qrcodeDir);
                }

                $qrCode = new QrCode($menuUrl);

                $writer = new SvgWriter();

                $result = $writer->write($qrCode);

                /*
                |--------------------------------------------------------------------------
                | Include branch ID in QR filename
                |--------------------------------------------------------------------------
                |
                | This prevents confusion when two branches both have
                | Table 1, Table 2, etc.
                |
                */

                $fileName =
                    $qrcodeDir .
                    '/branch_' .
                    $branchId .
                    '_table_' .
                    $validated['table_number'] .
                    '_' .
                    uniqid('qr_', true) .
                    '.svg';

                $saved = Storage::disk('public')->put(
                    $fileName,
                    $result->getString()
                );

                if ($saved === false) {
                    throw new \RuntimeException(
                        'Failed to save QR code image to storage.'
                    );
                }

                $qrPath = $fileName;
            } catch (\Exception $e) {

                Log::error(
                    'QR code generation failed',
                    [
                        'error' => $e->getMessage(),
                        'file' => $e->getFile(),
                        'line' => $e->getLine(),
                        'table_number' =>
                            $validated['table_number'],
                        'branch_id' => $branchId,
                        'menu_url' =>
                            $menuUrl ?? 'not generated',
                    ]
                );

                return back()
                    ->withErrors([
                        'table_number' =>
                            'Failed to generate QR code for this table. Please check server configuration and try again.',
                    ])
                    ->withInput();
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Create Table
        |--------------------------------------------------------------------------
        |
        | IMPORTANT:
        | branch_id is assigned automatically.
        | The user cannot choose another branch from the form.
        |
        */

        RestaurantTable::create([
            'branch_id' => $branchId,
            'table_number' =>
                $validated['table_number'],
            'qr_code' => $qrPath,
            'status' => 'available',
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' =>
                'Restaurant table created successfully.',
        ]);

        return back();
    }

    /**
     * Display the specified table.
     *
     * We are using a modal on the index page,
     * so this method is not required for the UI.
     */
    public function show(
        Request $request,
        RestaurantTable $table
    ) {
        $branchId = $this->currentBranchId($request);

        // Do not allow access to another branch's table.
        abort_unless(
            $table->branch_id === $branchId,
            404
        );

        return redirect()->route(
            'manager.tables.index'
        );
    }

    /**
     * Show the form for editing the specified table.
     *
     * We are using a modal on the index page,
     * so this method is not required for the UI.
     */
    public function edit(
        Request $request,
        RestaurantTable $table
    ) {
        $branchId = $this->currentBranchId($request);

        // Do not allow editing another branch's table.
        abort_unless(
            $table->branch_id === $branchId,
            404
        );

        return redirect()->route(
            'manager.tables.index'
        );
    }

    /**
     * Update the specified table.
     */
    public function update(
        Request $request,
        RestaurantTable $table
    ) {
        $branchId = $this->currentBranchId($request);

        // Do not allow updating another branch's table.
        abort_unless(
            $table->branch_id === $branchId,
            404
        );

        $validated = $request->validate([
            'table_number' => [
                'required',
                'integer',
                'min:1',
                'max:65535',

                // Unique only inside this branch.
                Rule::unique(
                    'restaurant_tables',
                    'table_number'
                )
                    ->ignore($table->id)
                    ->where(function ($query) use ($branchId) {
                        return $query->where(
                            'branch_id',
                            $branchId
                        );
                    }),
            ],

            'qr_code' => [
                'nullable',
                'string',
                'max:255',

                Rule::unique(
                    'restaurant_tables',
                    'qr_code'
                )->ignore($table->id),
            ],
        ]);

        $table->update([
            'table_number' =>
                $validated['table_number'],

            'qr_code' =>
                $validated['qr_code']
                ?? $table->qr_code,

            // Keep the table assigned
            // to the current branch.
            'branch_id' => $branchId,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' =>
                'Restaurant table updated successfully.',
        ]);

        return back();
    }

    /**
     * Remove the specified table.
     */
    public function destroy(
        Request $request,
        RestaurantTable $table
    ) {
        $branchId = $this->currentBranchId($request);

        // Do not allow deleting another branch's table.
        abort_unless(
            $table->branch_id === $branchId,
            404
        );

        if ($table->status !== 'available') {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' =>
                    'You cannot delete a table that is currently occupied.',
            ]);

            return back();
        }

        if (
            $table->qr_code &&
            Storage::disk('public')->exists(
                $table->qr_code
            )
        ) {
            Storage::disk('public')->delete(
                $table->qr_code
            );
        }

        $table->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' =>
                'Restaurant table deleted successfully.',
        ]);

        return back();
    }

    /**
     * Toggle the status of a table
     * (available <-> occupied).
     */
    public function toggleStatus(
        Request $request,
        RestaurantTable $table
    ) {
        $branchId = $this->currentBranchId($request);

        // Do not allow changing another branch's table.
        abort_unless(
            $table->branch_id === $branchId,
            404
        );

        if (
            $table->status ===
            'awaiting_payment'
        ) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' =>
                    'Cannot manually change status of a table awaiting payment.',
            ]);

            return back();
        }

        $table->update([
            'status' =>
                $table->status === 'available'
                ? 'occupied'
                : 'available',
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' =>
                'Table status updated successfully.',
        ]);

        return back();
    }
}

