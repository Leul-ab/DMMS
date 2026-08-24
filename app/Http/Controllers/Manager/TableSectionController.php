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
    public function index(Request $request): Response
    {
        $sections = TableSection::query()
            ->withCount('tables')
            ->ordered()
            ->get();

        return Inertia::render('manager/tables/index', [
            'sections' => $sections,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $validated['branch_id'] = Branch::current()?->id;

        $maxSortOrder = TableSection::query()->lockForUpdate()->max('sort_order') ?? 0;
        $validated['sort_order'] = $maxSortOrder + 1;

        TableSection::create($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Section created successfully.',
        ]);

        return back();
    }

    public function edit(TableSection $section): Response
    {
        return Inertia::render('manager/tables/index', [
            'editingSection' => $section,
        ]);
    }

    public function update(Request $request, TableSection $section): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);

        $section->update($validated);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Section updated successfully.',
        ]);

        return back();
    }

    public function destroy(TableSection $section): RedirectResponse
    {
        if ($section->tables()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Cannot delete section with tables assigned. Move tables first.',
            ]);

            return back();
        }

        $section->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Section deleted successfully.',
        ]);

        return back();
    }
}
