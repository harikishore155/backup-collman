import { combineReducers } from "@reduxjs/toolkit";
import authReducer from "@/features/auth/authSlice";
import notificationsReducer from "@/features/notifications/notificationSlice";
// import clientsReducer from "@/features/clients/clientsSlice";
// import featureReducer from "@/features/global/featureSlice";

const rootReducer = combineReducers({
    auth: authReducer,
    notifications: notificationsReducer,
    // clients: clientsReducer,
    // feature: featureReducer,
});
export default rootReducer;
