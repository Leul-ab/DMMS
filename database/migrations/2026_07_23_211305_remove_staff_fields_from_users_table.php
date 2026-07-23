<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['branch_id']);
            $table->dropColumn(['branch_id', 'salary', 'date_of_birth', 'emergency_contact']);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete()->after('department_id');
            $table->decimal('salary', 10, 2)->nullable()->after('shift_id');
            $table->date('date_of_birth')->nullable()->after('gender');
            $table->string('emergency_contact')->nullable()->after('address');
        });
    }
};
