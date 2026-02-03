import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { MockRecording, MockRecordingInput } from '../../types/mock';
import { v4 as uuidv4 } from 'uuid';

// Initial Mock Data
const INITIAL_DATA: MockRecording[] = [
    {
        id: '24342',
        name: 'Recording #24342',
        date: '16 October 15:17',
        duration: '01:06:51',
        startTime: '10:15',
        endTime: '11:22',
        status: 'saved',
    },
    {
        id: '89686',
        name: 'Recording #89686',
        date: '16 October 13:15',
        duration: '00:45:10',
        startTime: '13:15',
        endTime: '14:00',
        status: 'won',
    },
    {
        id: '46897',
        name: 'Recording #46897',
        date: '15 October 09:50',
        duration: '00:12:30',
        startTime: '09:50',
        endTime: '10:02',
        status: 'posted',
    },
    {
        id: '23871',
        name: 'Recording #23871',
        date: '14 October 10:17',
        duration: '00:30:00',
        startTime: '10:17',
        endTime: '10:47',
        status: 'saved',
    },
];

// In-memory storage for the session
let mockDatabase = [...INITIAL_DATA];

export const recordingsApi = createApi({
    reducerPath: 'recordingsApi',
    baseQuery: fetchBaseQuery({ baseUrl: '/' }), // Dummy base URL
    tagTypes: ['Recording'],
    endpoints: (builder) => ({
        getRecordings: builder.query<MockRecording[], void>({
            queryFn: async () => {
                // Simulate network delay
                await new Promise((resolve) => setTimeout(resolve, 500));
                return { data: mockDatabase };
            },
            providesTags: ['Recording'],
        }),
        addRecording: builder.mutation<MockRecording, MockRecordingInput>({
            queryFn: async (input) => {
                await new Promise((resolve) => setTimeout(resolve, 1000));

                const id = Math.floor(Math.random() * 100000).toString();
                const now = new Date();
                const dateStr = `${now.getDate()} ${now.toLocaleString('en-US', { month: 'long' })} ${now.getHours()}:${now.getMinutes().toString().padStart(2, '0')}`;

                // Format duration HH:MM:SS
                const hours = Math.floor(input.durationSec / 3600);
                const minutes = Math.floor((input.durationSec % 3600) / 60);
                const seconds = Math.floor(input.durationSec % 60);
                const durationStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                const startTimeStr = `${input.startedAt.getHours()}:${input.startedAt.getMinutes().toString().padStart(2, '0')}`;
                const endTimeStr = `${input.endedAt.getHours()}:${input.endedAt.getMinutes().toString().padStart(2, '0')}`;

                const newRecording: MockRecording = {
                    id,
                    name: `Recording #${id}`,
                    date: dateStr,
                    duration: durationStr,
                    startTime: startTimeStr,
                    endTime: endTimeStr,
                    status: 'saved',
                    localUri: input.localUri,
                };

                mockDatabase = [newRecording, ...mockDatabase];
                return { data: newRecording };
            },
            invalidatesTags: ['Recording'],
        }),
        deleteRecording: builder.mutation<void, string>({
            queryFn: async (id) => {
                await new Promise((resolve) => setTimeout(resolve, 500));
                mockDatabase = mockDatabase.filter((r) => r.id !== id);
                return { data: undefined };
            },
            invalidatesTags: ['Recording'],
        }),
    }),
});

export const { useGetRecordingsQuery, useAddRecordingMutation, useDeleteRecordingMutation } = recordingsApi;
