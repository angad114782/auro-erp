// routes/costsheet.routes.js
import { Router } from "express";
import {
  init, get, saveSummary,
  addSectionItem, updateSectionItem, removeSectionItem, assignDepartment,
  addLabourItem, updateLabourItem, removeLabourItem,
  submit, approve, reject
} from "../controllers/costsheet.controller.js";

const r = Router({ mergeParams: true });

// initialize & fetch
r.post("/init", init);
r.get("/", get);

// summary inputs (overhead/additional/margin/notes)
r.patch("/summary", saveSummary);

// sections CRUD (upper/component/material/packaging/misc)
r.post("/section/:section/items", addSectionItem);
r.patch("/section/:section/items/:itemId", updateSectionItem);
r.delete("/section/:section/items/:itemId", removeSectionItem);

// department tag
r.patch("/section/:section/items/:itemId/department", assignDepartment);

// labour CRUD
r.post("/labour", addLabourItem);
r.patch("/labour/:labourId", updateLabourItem);
r.delete("/labour/:labourId", removeLabourItem);

// workflow
r.post("/submit", submit);
r.post("/approve", approve);
r.post("/reject", reject);

export default r;
