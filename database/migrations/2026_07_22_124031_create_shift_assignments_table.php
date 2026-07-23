<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shift_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('shift_id')->constrained()->cascadeOnDelete();
            $table->date('date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'shift_id', 'date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shift_assignments');
    }
};
