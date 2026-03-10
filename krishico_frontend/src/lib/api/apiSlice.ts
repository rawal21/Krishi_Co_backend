import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:5050/api' }), // Pointing to your existing backend
  endpoints: (builder) => ({
    getWeather: builder.query<{ temp: number; humidity: number }, string>({
      query: (pincode) => `/weather/${pincode}`,
    }),
    getMarketPrices: builder.query<any[], { crop: string; mandis: string }>({
      query: ({ crop, mandis }) => `/market/prices?crop=${crop}&mandis=${mandis}`,
    }),
    updateProfile: builder.mutation<any, { userId: string; updates: any }>({
      query: (data) => ({
        url: '/profile',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const { useGetWeatherQuery, useGetMarketPricesQuery, useUpdateProfileMutation } = apiSlice;
