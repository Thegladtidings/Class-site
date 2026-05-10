// controllers/subjectController.js
import Subject from "../models/subject.js";

/* ─────────────────────────────────────────────────────────────
   GET /api/subjects
   Returns every active subject (sorted A-Z).
   Used by any page that needs the subject dropdown.
───────────────────────────────────────────────────────────── */
export const getAllSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true })
      .sort({ name: 1 })
      .select("_id name code");

    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch subjects", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/subjects
   Body: { name, code? }
   Creates a new global subject.
   Typically called by an admin / senior teacher.
───────────────────────────────────────────────────────────── */
export const createSubject = async (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Subject name is required" });
    }

    // Check duplicate (case-insensitive via collation index)
    const existing = await Subject.findOne({ name: name.trim() }).collation({ locale: "en", strength: 2 });
    if (existing) {
      return res.status(409).json({ message: `Subject "${name.trim()}" already exists` });
    }

    const subject = await Subject.create({
      name:      name.trim(),
      code:      code?.trim() ?? "",
      createdBy: req.user?._id,   // attach if you have auth middleware
    });

    res.status(201).json({ message: "Subject created", subject });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Subject already exists" });
    }
    res.status(500).json({ message: "Failed to create subject", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   PATCH /api/subjects/:id
   Body: { name?, code?, isActive? }
   Updates name / code, or toggles isActive (soft-delete).
───────────────────────────────────────────────────────────── */
export const updateSubject = async (req, res) => {
  try {
    const { name, code, isActive } = req.body;
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    if (name !== undefined)     subject.name     = name.trim();
    if (code !== undefined)     subject.code     = code.trim();
    if (isActive !== undefined) subject.isActive = Boolean(isActive);

    await subject.save();
    res.json({ message: "Subject updated", subject });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "Another subject with that name already exists" });
    }
    res.status(500).json({ message: "Failed to update subject", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   DELETE /api/subjects/:id
   Hard-deletes a subject.
   Prefer PATCH isActive=false to preserve historical grade data.
───────────────────────────────────────────────────────────── */
export const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findByIdAndDelete(req.params.id);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }
    res.json({ message: "Subject deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete subject", error: err.message });
  }
};

/* ─────────────────────────────────────────────────────────────
   POST /api/subjects/seed
   One-time helper: bulk-insert defaults if collection is empty.
   Call once during setup; remove or gate behind admin auth after.
───────────────────────────────────────────────────────────── */
export const seedSubjects = async (req, res) => {
  try {
    const count = await Subject.countDocuments();
    if (count > 0) {
      return res.json({ message: "Subjects already seeded", count });
    }

    const defaults = [
      { name: "Mathematics",         code: "MTH" },
      { name: "Further Mathematics", code: "FMT" },
      { name: "English",             code: "ENG" },
      { name: "Physics",             code: "PHY" },
      { name: "Chemistry",           code: "CHE" },
      { name: "Biology",             code: "BIO" },
      { name: "Economics",            code: "ECO" },
    ];

    const inserted = await Subject.insertMany(defaults);
    res.status(201).json({ message: "Subjects seeded", count: inserted.length });
  } catch (err) {
    res.status(500).json({ message: "Seeding failed", error: err.message });
  }
};