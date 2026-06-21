// import { createSlice } from "@reduxjs/toolkit";
// import { fetchClientsThunk } from "./clientsThunk";

// const initialState = {
//     items: [],
//     totalCount: 0,
//     loading: false,
//     error: null,
// };

// const clientsSlice = createSlice({
//     name: "clients",
//     initialState,
//     reducers: {},
//     extraReducers: (builder) => {
//         builder
//             .addCase(fetchClientsThunk.pending, (state) => {
//                 state.loading = true;
//                 state.error = null;
//             })
//             .addCase(fetchClientsThunk.fulfilled, (state, action) => {
//                 state.loading = false;
//                 state.items = action.payload.clients;
//                 state.totalCount = action.payload.totalCount;
//                 state.error = null;
//             })
//             .addCase(fetchClientsThunk.rejected, (state, action) => {
//                 state.loading = false;
//                 state.error = action.payload || "Failed to load clients";
//                 state.items = [];
//                 state.totalCount = 0;
//             });
//     },
// });

// export default clientsSlice.reducer;
