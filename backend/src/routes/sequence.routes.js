import { Router } from "express";
import { reserve, cancel } from "../controllers/sequence.controller.js";

const r = Router({ mergeParams: true });
r.post("/:name/reserve", reserve); // on modal open
r.post("/:id/cancel", cancel); // on modal close/cancel
export default r;
