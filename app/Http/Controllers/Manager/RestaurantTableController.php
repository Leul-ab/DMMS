<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\RestaurantTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

class RestaurantTableController extends Controller
{
    /**
     * Display all restaurant tables.
     */
    public function index()
    {
        $tables = RestaurantTable::query()
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
                'unique:restaurant_tables,table_number',
            ],
            'qr_code' => [
                'nullable',
                'string',
                'max:255',
                'unique:restaurant_tables,qr_code',
            ],
        ]);

        $qrPath = null;
        if (!empty($validated['qr_code'])) {
            $qrPath = $validated['qr_code'];
        } else {
            // Generate QR code for the table menu/booking URL
            $menuUrl = route('booking.index') . '?table=' . $validated['table_number'];
            $qrCode = new QrCode($menuUrl);
            $writer = new PngWriter();
            $result = $writer->write($qrCode);
            
            $fileName = 'qrcodes/table_' . $validated['table_number'] . '_' . uniqid() . '.png';
            Storage::disk('public')->put($fileName, $result->getString());
            $qrPath = $fileName;
        }

        RestaurantTable::create([
            'table_number' => $validated['table_number'],
            'qr_code' => $qrPath,
            'status' => 'available',
        ]);

        return back()->with(
            'success',
            'Restaurant table created successfully.'
        );
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
                'unique:restaurant_tables,table_number,' . $table->id,
            ],
            'qr_code' => [
                'nullable',
                'string',
                'max:255',
                'unique:restaurant_tables,qr_code,' . $table->id,
            ],
        ]);

        $table->update([
            'table_number' => $validated['table_number'],
            'qr_code' => $validated['qr_code']
                ?? $table->qr_code,
        ]);

        return back()->with(
            'success',
            'Restaurant table updated successfully.'
        );
    }

    /**
     * Remove the specified table.
     */
    public function destroy(RestaurantTable $table)
    {
        if ($table->status !== 'available') {
            return back()->with(
                'error',
                'You cannot delete a table that is currently occupied.'
            );
        }

        if ($table->qr_code && Storage::disk('public')->exists($table->qr_code)) {
            Storage::disk('public')->delete($table->qr_code);
        }
        
        $table->delete();

        return back()->with(
            'success',
            'Restaurant table deleted successfully.'
        );
    }

    /**
     * Toggle the status of a table (available <-> occupied).
     */
    public function toggleStatus(RestaurantTable $table)
    {
        if ($table->status === 'awaiting_payment') {
            return back()->with('error', 'Cannot manually change status of a table awaiting payment.');
        }

        $table->update([
            'status' => $table->status === 'available' ? 'occupied' : 'available',
        ]);

        return back()->with('success', 'Table status updated successfully.');
    }
}