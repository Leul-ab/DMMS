<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->nullable()->after('name');
            $table->string('last_name')->nullable()->after('first_name');
            $table->string('employee_id')->unique()->nullable()->after('last_name');
            $table->string('gender')->nullable()->after('phone');
            $table->date('date_of_birth')->nullable()->after('gender');
            $table->foreignId('department_id')->nullable()->constrained()->nullOnDelete()->after('role_id');
            $table->foreignId('branch_id')->nullable()->constrained()->nullOnDelete()->after('department_id');
            $table->foreignId('shift_id')->nullable()->constrained()->nullOnDelete()->after('branch_id');
            $table->decimal('salary', 10, 2)->nullable()->after('shift_id');
            $table->text('address')->nullable()->after('salary');
            $table->string('emergency_contact')->nullable()->after('address');
            $table->date('hire_date')->nullable()->after('emergency_contact');
            $table->string('photo')->nullable()->after('hire_date');
            $table->string('status')->default('active')->after('is_active');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'first_name',
                'last_name',
                'employee_id',
                'gender',
                'date_of_birth',
                'department_id',
                'branch_id',
                'shift_id',
                'salary',
                'address',
                'emergency_contact',
                'hire_date',
                'photo',
                'status',
            ]);
        });
    }
};
