import { createSlice, type PayloadAction } from '@reduxjs/toolkit'

export type SideBarState = {
  sideBarExpanded: boolean
}

const initialState: SideBarState = {
  sideBarExpanded: true,
}

const sideBarSlice = createSlice({
  name: 'sideBar',
  initialState,
  reducers: {
    setSideBarExpanded: (state, action: PayloadAction<boolean>) => {
      state.sideBarExpanded = action.payload
    },
  },
})

export const { setSideBarExpanded } = sideBarSlice.actions
export default sideBarSlice.reducer
