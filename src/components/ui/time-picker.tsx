import { Clock8Icon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type TimePickerProps = {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    disabled?: boolean;
    step?: number;
};

export function TimePicker({
    id,
    label,
    value,
    onChange,
    required,
    disabled,
    step = 60,
}: TimePickerProps) {
    return (
        <div className="w-full space-y-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center pl-3 text-muted-foreground">
                    <Clock8Icon className="size-4" />
                    <span className="sr-only">{label}</span>
                </div>
                <Input
                    type="time"
                    id={id}
                    step={step}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className="peer bg-background appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                    required={required}
                    disabled={disabled}
                />
            </div>
        </div>
    );
}

export default TimePicker;
