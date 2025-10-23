import { Router } from "express";
import {
  signupHandle,
  loginHandle,
  fogotPasswordHandle,
  verifyPasswordHandle,
  changePasswordHandle,
  teacherRoomsHandle,
  scheduleHandle,
  myScheduleHandle,
  getProfileHandle
} from "../controllers/teacherController.js";
import { auth } from "../middlewares/auth.js";


const teacherRouter = Router();

teacherRouter.post("/register", signupHandle);
teacherRouter.post("/login", loginHandle);
teacherRouter.post("/forgot-password", fogotPasswordHandle);
teacherRouter.get("/verify-password/:id", verifyPasswordHandle);
teacherRouter.post("/change-password", changePasswordHandle);
teacherRouter.get("/get-profile", auth, getProfileHandle);
teacherRouter.get("/rooms", auth, teacherRoomsHandle);
teacherRouter.post("/schedule", auth, scheduleHandle);
teacherRouter.get("/schedule", auth, myScheduleHandle)

export default teacherRouter;
