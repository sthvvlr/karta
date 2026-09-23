import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  birthDate: text("birth_date"),
  gender: text("gender"),
  cityCurrent: text("city_current"),
  countryCurrent: text("country_current"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const profileLocations = sqliteTable("profile_locations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  city: text("city").notNull(),
  country: text("country"),
  fromYear: integer("from_year"),
  toYear: integer("to_year"),
  isCurrent: integer("is_current", { mode: "boolean" }).notNull().default(false),
});

export const vaccines = sqliteTable("vaccines", {
  id: text("id").primaryKey(),
  nameRu: text("name_ru").notNull(),
  nameEn: text("name_en").notNull(),
  descriptionRu: text("description_ru"),
  scheduleRu: text("schedule_ru"),
  intervalYears: integer("interval_years"),
  totalDoses: integer("total_doses").notNull().default(1),
  audience: text("audience"),
  pregnancyRelevant: integer("pregnancy_relevant", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull(),
});

export const vaccineDoses = sqliteTable("vaccine_doses", {
  id: text("id").primaryKey(),
  vaccineId: text("vaccine_id").notNull(),
  doseNumber: integer("dose_number").notNull(),
  afterPreviousDays: integer("after_previous_days"),
});

export const vaccineBrands = sqliteTable("vaccine_brands", {
  id: text("id").primaryKey(),
  vaccineId: text("vaccine_id").notNull(),
  name: text("name").notNull(),
  region: text("region"),
});

export const vaccinations = sqliteTable("vaccinations", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  vaccineId: text("vaccine_id").notNull(),
  dateGiven: text("date_given"),
  doseNumber: integer("dose_number").notNull().default(1),
  brand: text("brand"),
  clinic: text("clinic"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const medications = sqliteTable("medications", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  dosage: text("dosage"),
  frequency: text("frequency"),
  timeSlots: text("time_slots"),
  mealRelation: text("meal_relation"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at").notNull(),
});

export const medicationLogs = sqliteTable("medication_logs", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  medicationId: text("medication_id").notNull(),
  scheduledAt: text("scheduled_at").notNull(),
  status: text("status").notNull().default("planned"),
  takenAt: text("taken_at"),
});

export const labResults = sqliteTable("lab_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  result: text("result"),
  unit: text("unit"),
  referenceRange: text("reference_range"),
  testedAt: text("tested_at"),
  fileKey: text("file_key"),
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const vaccinationUserDateIndex = uniqueIndex("vaccinations_user_date_idx").on(vaccinations.userId, vaccinations.dateGiven);
