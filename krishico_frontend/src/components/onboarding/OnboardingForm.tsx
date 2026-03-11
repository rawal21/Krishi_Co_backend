'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, Button, Input } from '@/components/ui/Base';
import { useDispatch } from 'react-redux';
import { setCredentials } from '@/lib/features/userSlice';
import { useUpdateProfileMutation } from '@/lib/api/apiSlice';
import { motion } from 'framer-motion';

const onboardingSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    location: z.string().min(3, 'Please enter a valid location'),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
});

type OnboardingData = z.infer<typeof onboardingSchema>;

export default function OnboardingForm() {
    const dispatch = useDispatch();
    const [updateProfile] = useUpdateProfileMutation();
    const { register, handleSubmit, formState: { errors } } = useForm<OnboardingData>({
        resolver: zodResolver(onboardingSchema),
    });

    const onSubmit = async (data: OnboardingData) => {
        const userId = `web-${Date.now()}`;
        const locationStr = `${data.location} (${data.pincode})`;

        // Save to backend
        await updateProfile({
            userId,
            updates: { name: data.name, location: locationStr, pincode: data.pincode }
        }).unwrap();

        // Save to local Redux state
        dispatch(setCredentials({
            userId,
            name: data.name,
            location: locationStr,
        }));
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md w-full"
        >
            <Card className="border-t-4 border-t-green-600">
                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-bold text-slate-800">Welcome to KrishiCo</h2>
                    <p className="text-slate-500 mt-1">Let's set up your agricultural dashboard</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <Input
                        label="Full Name"
                        placeholder="e.g. Dikshit Rawal"
                        {...register('name')}
                        error={errors.name?.message}
                    />
                    <Input
                        label="Location / Village"
                        placeholder="e.g. Tonk, Rajasthan"
                        {...register('location')}
                        error={errors.location?.message}
                    />
                    <Input
                        label="Pincode"
                        placeholder="e.g. 304001"
                        {...register('pincode')}
                        error={errors.pincode?.message}
                    />

                    <Button type="submit" className="w-full mt-4 py-3">
                        Setup My Dashboard
                    </Button>
                </form>
            </Card>
        </motion.div>
    );
}
