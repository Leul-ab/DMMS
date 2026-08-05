<?php

namespace Database\Seeders;

use App\Models\Feedback;
use App\Models\Order;
use Illuminate\Database\Seeder;

class FeedbackSeeder extends Seeder
{
    public function run(): void
    {
        $orders = Order::where('status', 'completed')
            ->where('payment_status', 'paid')
            ->get();

        if ($orders->isEmpty()) {
            $this->command->info('No completed + paid orders found to attach feedback to.');

            return;
        }

        $comments = [
            'The food was delicious and the service was excellent!',
            'Great experience, fast delivery and friendly staff.',
            'The burger was amazing and served quickly.',
            'Loved the atmosphere and the food quality. Will come again!',
            'Excellent service and tasty meal. Highly recommended.',
        ];

        foreach ($orders as $index => $order) {
            if ($order->feedback) {
                continue;
            }

            Feedback::create([
                'order_id' => $order->id,
                'customer_id' => $order->customer_id,
                'overall_rating' => rand(3, 5),
                'comment' => $comments[$index % count($comments)],
                'anonymous' => false,
            ]);
        }

        $this->command->info('Feedback seeded successfully for '.count($orders).' orders.');
    }
}
