<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'preparation_time')) {
                $table->unsignedSmallInteger('preparation_time')->nullable()->after('estimated_minutes');
            }
            if (!Schema::hasColumn('orders', 'preparation_started_at')) {
                $table->timestamp('preparation_started_at')->nullable()->after('preparation_time');
            }
            if (!Schema::hasColumn('orders', 'preparation_completed_at')) {
                $table->timestamp('preparation_completed_at')->nullable()->after('preparation_started_at');
            }
            if (!Schema::hasColumn('orders', 'preparation_status')) {
                $table->enum('preparation_status', ['waiting', 'preparing', 'ready', 'completed'])
                    ->default('waiting')
                    ->after('preparation_completed_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'preparation_time',
                'preparation_started_at',
                'preparation_completed_at',
                'preparation_status',
            ]);
        });
    }
};
