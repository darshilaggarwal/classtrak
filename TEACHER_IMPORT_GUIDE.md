# 📚 Teacher Import Guide - Structured Data Format

## 🎯 **The Problem**
The current system works perfectly, but the **input data format** needs to be structured correctly to map subjects to the right courses and semesters.

## ✅ **Solution: Structured JSON Format**

### 📋 **Required JSON Structure**

```json
{
  "teachers": [
    {
      "name": "Teacher Full Name",
      "email": "teacher@imaginxp.com",
      "username": "teacher.username",
      "phone": "9876543210",
      "subjects": [
        {
          "name": "Subject Name",
          "code": "SUBJECT_CODE",  // Can be empty, will be auto-generated
          "course": "BTech AIML",
          "semester": 1
        }
      ]
    }
  ]
}
```

### 🎓 **Available Courses**
- `BTech AIML`
- `BTech FSD` 
- `BBA DM`
- `BCA FSD`
- `BDes`

### 📚 **Available Semesters**
- `1` (1st Semester)
- `3` (3rd Semester)
- `5` (5th Semester)
- `7` (7th Semester)

## 🔧 **How to Use**

### **Option 1: Direct Script Import**
1. Replace the sample data in `backend/import-teachers-structured.js`
2. Run: `node import-teachers-structured.js`

### **Option 2: Admin Interface Import**
1. Go to Admin Dashboard → Teachers
2. Click "Import Teachers (Structured)"
3. Upload your JSON file

### **Option 3: Manual Data Entry**
1. Use the template format above
2. Create your JSON file
3. Import via admin interface

## 📝 **Example Data**

```json
{
  "teachers": [
    {
      "name": "Mr. Chaman Kumar",
      "email": "chaman.kumar@imaginxp.com",
      "username": "chaman.kumar",
      "phone": "9876543210",
      "subjects": [
        {
          "name": "Introduction to Machine Learning",
          "code": "",  // Empty code - will be auto-generated as "ITML"
          "course": "BTech AIML",
          "semester": 1
        },
        {
          "name": "Computer Networks",
          "code": "",  // Empty code - will be auto-generated as "CN"
          "course": "BCA FSD",
          "semester": 5
        }
      ]
    }
  ]
}
```

## ✅ **What This Will Create**

### **For Each Teacher:**
- ✅ Teacher profile with email/username
- ✅ Subjects mapped to correct courses
- ✅ Subjects mapped to correct semesters
- ✅ Automatic course assignment based on subjects
- ✅ Proper batch mapping for attendance

### **In Admin Dashboard:**
- ✅ Shows all subjects for each teacher
- ✅ Shows which batches each subject is taught in
- ✅ Shows course and semester for each subject

### **In Teacher Portal:**
- ✅ Teachers see their assigned subjects
- ✅ Subjects show correct course and semester
- ✅ Proper attendance tracking per batch

## 🚀 **Ready to Use**

1. **Create your JSON** using the format above
2. **Import via admin interface** or script
3. **Subject codes will be auto-generated** if empty
4. **Teachers can signup** with OTP
5. **Everything will be mapped correctly!**

## 📝 **Subject Code Auto-Generation**

If you leave the `code` field empty (`"code": ""`), the system will automatically generate codes:

- **Regular Subjects**: First letters of each word (e.g., "Introduction to Machine Learning" → "ITML")
- **Lab Subjects**: "LAB_" + first letters of main subject (e.g., "Lab - Computer Networks" → "LAB_CN")
- **Code Length**: Limited to 8 characters maximum

## 📞 **Need Help?**

If you have your data in a different format, I can help you convert it to this structure. Just share your current data format and I'll create a conversion script.
