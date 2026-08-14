<?php

namespace App\Http\Controllers\Manager;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\TableSection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TableSectionController extends Controller
{
    public function index(): Response
    {
        $sections = TableSection::query()
            ->withCount('tables')
            ->orderBy('name')
            ->get();

        return Inertia::render('manager/tables/sections/index', [
            'sections' => $sections,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('manager/tables/sections/create');
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'status' => [
                'required',
                'in:active,inactive',
            ],
        ]);

        $validated['branch_id'] = Branch::current()?->id;

        TableSection::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Section created successfully.',
        ]);

        return to_route('manager.tables.index');
    }

    public function edit(TableSection $tableSection): Response
    {
        return Inertia::render('manager/tables/sections/edit', [
            'section' => $tableSection,
        ]);
    }

    public function update(Request $request, TableSection $tableSection): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],
            'status' => [
                'required',
                'in:active,inactive',
            ],
        ]);

        $tableSection->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Section updated successfully.',
        ]);

        return to_route('manager.tables.index');
    }

    public function destroy(TableSection $tableSection): RedirectResponse
    {
        $tablesCount = $tableSection->tables()->count();

        if ($tablesCount > 0) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => "Cannot delete section '{$tableSection->name}' because it contains {$tablesCount} table(s). Reassign the tables first.",
            ]);

            return back();
        }

        $tableSection->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Section deleted successfully.',
        ]);

        return to_route('manager.tables.index');
    }
}
