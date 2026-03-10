import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UserState {
  userId: string | null;
  name: string | null;
  location: string | null;
  isAuthenticated: boolean;
}

const initialState: UserState = {
  userId: null,
  name: null,
  location: null,
  isAuthenticated: false,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<{ userId: string; name: string; location: string }>) => {
      state.userId = action.payload.userId;
      state.name = action.payload.name;
      state.location = action.payload.location;
      state.isAuthenticated = true;
    },
    logout: (state) => {
      state.userId = null;
      state.name = null;
      state.location = null;
      state.isAuthenticated = false;
    },
  },
});

export const { setCredentials, logout } = userSlice.actions;
export default userSlice.reducer;
