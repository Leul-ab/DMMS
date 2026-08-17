import React from 'react';
import { createRoot } from 'react-dom/client';
import { DateTimeRangePicker } from '@/components/date-time-picker';

function App() {
    const [start, setStart] = React.useState('');
    const [end, setEnd] = React.useState('');

    return (
        <div style={{ padding: 24, fontFamily: 'system-ui' }}>
            <h2>Discount Date/Time Range (test harness)</h2>
            <div style={{ marginBottom: 12 }}>
                start_value: <b id="startVal">{start}</b> &nbsp;|&nbsp; end_value: <b
                    id="endVal"
                >{end}</b>
            </div>
            <DateTimeRangePicker
                startValue={start}
                endValue={end}
                onStartChange={setStart}
                onEndChange={setEnd}
                defaultStartTime="09:00"
                defaultEndTime="23:59"
                placeholder="Select discount period"
            />
        </div>
    );
}

createRoot(document.getElementById('root')!).render(<App />);
