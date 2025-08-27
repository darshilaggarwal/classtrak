# 📋 ClassTrack Sample Data Files

This folder contains sample JSON files for importing data into the ClassTrack system. Follow the import order below for proper data setup.

## 📁 Files Overview

### 1. `01-teachers-import-sample.json`
- **Purpose**: Import teachers with their subject assignments
- **Contains**: 12 teachers with complete subject mappings
- **Format**: Teachers with departments, subjects, and contact information

### 2. `02-students-import-sample.json`
- **Purpose**: Import students with batch assignments
- **Contains**: 44 students for BTech AIML 5th Sem (2023-27)
- **Format**: Students with roll numbers, contact info, and batch assignments

### 3. `03-timetable-import-sample.json`
- **Purpose**: Import weekly timetable for a specific batch
- **Contains**: Complete 6-day timetable for BTech AIML 5th Sem
- **Format**: Weekly schedule with periods, subjects, rooms, and timing

## 🔄 Import Process Order

### **Step 1: Import Teachers** ⭐
```bash
# Use the admin portal or API endpoint
POST /api/admin/import/teachers
Body: Content of 01-teachers-import-sample.json
```

**What happens:**
- Creates teacher accounts with default password "teacher123"
- Creates departments/courses automatically
- Creates subjects with proper semester mapping
- Links teachers to their assigned subjects

### **Step 2: Import Students** ⭐
```bash
# Use the admin portal or API endpoint
POST /api/admin/import/students
Body: Content of 02-students-import-sample.json
```

**What happens:**
- Creates student accounts with default password "student123"
- Creates batches automatically if they don't exist
- Assigns students to specified batches
- Links students to departments

### **Step 3: Import Timetable** ⭐
```bash
# Use the admin portal or API endpoint
POST /api/admin/import/timetable
Body: Content of 03-timetable-import-sample.json
```

**What happens:**
- Creates timetable entries for the specified batch
- Automatically assigns teachers based on subject names
- Links periods to subjects and rooms
- Sets up weekly schedule structure

## 🎯 Key Features

### **Teacher Import Features:**
- ✅ Auto-generates email if not provided
- ✅ Creates departments/courses automatically
- ✅ Handles subject codes and semester mapping
- ✅ Supports multiple departments per teacher
- ✅ Default password: "teacher123"

### **Student Import Features:**
- ✅ Auto-generates email if not provided
- ✅ Creates batches automatically
- ✅ Supports roll number validation
- ✅ Links to departments
- ✅ Default password: "student123"

### **Timetable Import Features:**
- ✅ Automatic teacher assignment by subject name
- ✅ Room allocation
- ✅ Break period handling
- ✅ Weekly schedule structure
- ✅ Time slot validation

## 🔧 Customization

### **Adding More Teachers:**
1. Copy the teacher object structure
2. Update name, username, email, phone
3. Add/remove subjects as needed
4. Ensure subject names match exactly

### **Adding More Students:**
1. Copy the student object structure
2. Update name, rno, email, phone
3. Ensure batch name matches exactly
4. Use unique roll numbers

### **Creating New Timetables:**
1. Update `batchName` to match your batch
2. Modify `weeklyTimetable` array
3. Ensure subject names match teacher assignments
4. Update room numbers and timing as needed

## ⚠️ Important Notes

### **Subject Name Matching:**
- Subject names in timetable MUST match exactly with teacher assignments
- Case-sensitive matching
- Include "Lab - " prefix for laboratory subjects

### **Batch Names:**
- Batch names must match exactly between student and timetable imports
- Format: "Course Semester (Year-Year)" e.g., "BTech AIML 5th Sem (2023-27)"

### **Department/Course Names:**
- Valid courses: "BTech AIML", "BTech FSD", "BCA FSD", "BBA DM", "BDes"
- These are treated as departments in the system

### **Default Passwords:**
- Teachers: "teacher123"
- Students: "student123"
- Users should change passwords on first login

## 🚀 Quick Start

1. **Clear existing data** (if needed)
2. **Import teachers** using `01-teachers-import-sample.json`
3. **Import students** using `02-students-import-sample.json`
4. **Import timetable** using `03-timetable-import-sample.json`
5. **Verify** teacher assignments and student attendance

## 📞 Support

If you encounter issues:
1. Check subject name matching
2. Verify batch names are consistent
3. Ensure all required fields are provided
4. Check server logs for detailed error messages

---

**Happy Importing! 🎉**
