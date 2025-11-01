# Student-Room Sync Guide

## Quick Start

### Method 1: Using Admin Portal (Recommended)

1. **Login to Admin Portal**
   - Navigate to the admin dashboard
   - Go to **Room Management** section

2. **Click "🔄 Sync Students to Rooms" Button**
   - This button is at the top right of the Room Management page
   - Confirm the operation when prompted

3. **Review Results**
   - A success message will show:
     - Number of students synced
     - Number of rooms updated
     - Occupancy statistics
     - Any capacity warnings

4. **View Room Details**
   - Browse rooms organized by floor
   - Click any room to see its occupants
   - View student details, change rooms, or unassign students

### Method 2: Using Command Line Script

If you prefer to run the sync from the terminal:

```bash
cd server
node scripts/syncStudentsToRooms.js
```

This will:
- Connect to your MongoDB database
- Find all active students with room assignments
- Sync them to their respective rooms
- Show detailed progress and summary

## What Happens During Sync?

1. **Fetches Students**: Gets all active students with `roomNumber` field populated
2. **Checks Rooms**: Verifies all rooms exist in the database
3. **Creates Missing Rooms**: If any room numbers from students don't exist, creates them
4. **Clears Occupants**: Clears all room occupants for a fresh sync
5. **Allocates Students**: Assigns students to their rooms based on `roomNumber`
6. **Checks Capacity**: Warns if any room exceeds its capacity (3 students)
7. **Updates Statistics**: Recalculates occupancy rates and statistics

## Understanding the Data Flow

### Student Model
```javascript
{
  name: "John Doe",
  rollNumber: "21A91A0501",
  roomNumber: "305",  // ← This field determines room assignment
  is_active: true,
  // ... other fields
}
```

### Room Model
```javascript
{
  roomNumber: "305",
  floor: 3,
  capacity: 3,
  occupants: [studentId1, studentId2],  // ← Updated during sync
  allocatedStudents: [studentId1, studentId2]  // ← Mirror of occupants
}
```

## Room Numbering Pattern

The system follows this pattern:
- **Floor 1**: Rooms 101-139 (39 rooms)
- **Floor 2**: Rooms 201-239 (39 rooms)
- **Floor 3**: Rooms 301-339 (39 rooms)
- ...
- **Floor 9**: Rooms 901-939 (39 rooms)
- **Floor 10**: Rooms 1001-1039 (39 rooms)
- **Floor 11**: Rooms 1101-1139 (39 rooms)
- **Floor 12**: Rooms 1201-1239 (39 rooms)

**Total**: 12 floors × 39 rooms = 468 rooms

## Capacity Management

- **Default Capacity**: 3 students per room
- **Capacity Check**: System warns if a room has more than 3 students
- **Over-Capacity Handling**: Students are still allocated even if over capacity (admin can fix later)

## Viewing Synced Data

### In Admin Portal

1. **Statistics Dashboard**
   - Total Rooms
   - Students Housed
   - Total Capacity
   - Fully Occupied Rooms
   - Partially Filled Rooms
   - Vacant Rooms
   - Occupancy Rate (with progress bar)

2. **Room Cards**
   - Organized by floor
   - Shows occupancy (e.g., 2/3)
   - Color-coded:
     - Green badge: Available space
     - Red badge: Fully occupied

3. **Room Details Panel**
   - Click any room to see details
   - Lists all occupants with:
     - Name
     - Roll Number
     - Action buttons (View, Change Room, Unassign)

## Common Scenarios

### Scenario 1: First Time Sync
```
Before: Rooms exist but have no occupants
After: All students assigned to their rooms based on roomNumber field
```

### Scenario 2: Re-Sync After Data Changes
```
Before: Some students moved or added
After: Fresh allocation based on current roomNumber values
```

### Scenario 3: Missing Rooms
```
Before: Student has roomNumber "1205" but room doesn't exist
After: Room 1205 is created automatically on Floor 12
```

### Scenario 4: Over-Capacity Room
```
Before: Room 305 has 4 students assigned
After: All 4 students allocated with warning message
Action: Admin can manually reassign students
```

## API Endpoints

### POST `/admin-api/rooms/sync`
**Purpose**: Sync students to rooms
**Auth**: Requires admin token
**Response**:
```json
{
  "message": "Student-room sync completed successfully",
  "sync": {
    "studentsProcessed": 150,
    "roomsCreated": 0,
    "roomsUpdated": 50,
    "uniqueRooms": 50
  },
  "statistics": {
    "totalRooms": 468,
    "totalCapacity": 1404,
    "totalOccupied": 150,
    "fullyOccupiedRooms": 20,
    "partiallyOccupiedRooms": 30,
    "vacantRooms": 418,
    "occupancyRate": "10.68"
  },
  "warnings": {
    "message": "2 rooms exceed capacity",
    "details": [...]
  }
}
```

### GET `/admin-api/rooms/all-with-students`
**Purpose**: Get all rooms with student details
**Auth**: Requires admin token

### GET `/admin-api/rooms/statistics`
**Purpose**: Get occupancy statistics
**Auth**: Requires admin token

### GET `/admin-api/room/:roomNumber/students`
**Purpose**: Get students in a specific room
**Auth**: Requires admin token

## Troubleshooting

### Issue: Students not showing in rooms
**Cause**: Student `roomNumber` field is empty or null
**Solution**: 
1. Check student data in database
2. Ensure `roomNumber` field is populated
3. Run sync again

### Issue: Room not found error
**Cause**: Room doesn't exist in database
**Solution**: Sync will create missing rooms automatically

### Issue: Capacity warnings
**Cause**: More than 3 students assigned to same room
**Solution**: 
1. Review the capacity warnings
2. Manually reassign students using "Change Room" feature
3. Update student `roomNumber` in database if needed

### Issue: Sync shows 0 students
**Cause**: No active students with room assignments
**Solution**:
1. Check if students are marked as `is_active: true`
2. Verify students have `roomNumber` field populated
3. Check database connection

## Data Consistency

### Automatic Updates
The system maintains consistency between students and rooms:
- When you sync, all room occupants are refreshed
- Room statistics are recalculated
- Frontend displays updated data immediately

### Manual Updates
If you manually update a student's room:
1. Use the "Change Room" feature in admin portal, OR
2. Update `roomNumber` in database and re-sync

## Best Practices

1. **Regular Syncs**: Run sync after bulk student updates
2. **Verify Data**: Check statistics after sync to ensure accuracy
3. **Handle Warnings**: Address capacity warnings promptly
4. **Backup First**: Consider backing up database before major syncs
5. **Off-Peak Hours**: Run large syncs during low-traffic times

## Performance Notes

- **Sync Time**: Depends on number of students (typically 1-5 seconds for 500 students)
- **Database Operations**: Uses efficient bulk updates
- **Memory Usage**: Minimal, processes students in batches
- **Concurrent Syncs**: Avoid running multiple syncs simultaneously

## Example Sync Output (CLI)

```
🔌 Connecting to MongoDB...
✅ Connected to MongoDB

📊 Fetching students with room assignments...
✅ Found 150 active students with room assignments

🏠 Unique rooms in student data: 50

🔍 Checking for missing rooms...
✅ All rooms exist in database

🧹 Clearing all room occupants for fresh sync...
✅ Cleared all room occupants

📦 Grouping students by room...
✅ Grouped students into 50 rooms

🔄 Syncing students to rooms...

  ✅ Room 101: 3/3 students
  ✅ Room 102: 2/3 students
  ⚠️ Room 103: 4 students > capacity 3
  ...

============================================================
📊 SYNC SUMMARY
============================================================
✅ Students processed: 150
✅ Rooms updated: 50
✅ Students allocated: 150
✅ Unique rooms: 50

⚠️ CAPACITY WARNINGS: 2 rooms exceed capacity
============================================================

Room 103:
  Allocated: 4 students
  Capacity: 3 students
  Students: 21A91A0501, 21A91A0502, 21A91A0503, 21A91A0504

============================================================
✅ Sync completed successfully!
============================================================
```

## Support

For issues or questions:
1. Check this guide first
2. Review server logs for detailed error messages
3. Verify database connectivity
4. Ensure all required fields are populated in student records

---

**Last Updated**: November 2024
**Version**: 1.0
