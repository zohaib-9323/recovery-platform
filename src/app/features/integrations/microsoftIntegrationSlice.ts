import { createSlice } from '@reduxjs/toolkit'

export type MicrosoftIntegrationState = {
  connected: boolean
}

const initialState: MicrosoftIntegrationState = {
  connected: false,
}

const microsoftIntegrationSlice = createSlice({
  name: 'microsoftIntegration',
  initialState,
  reducers: {
    connectMicrosoft365: (state) => {
      state.connected = true
    },
    disconnectMicrosoft365: (state) => {
      state.connected = false
    },
  },
})

export const { connectMicrosoft365, disconnectMicrosoft365 } = microsoftIntegrationSlice.actions
export default microsoftIntegrationSlice.reducer
