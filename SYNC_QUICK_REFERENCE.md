# 🚀 Quick Sync Reference

## Run Sync Script
```bash
cd server
node utils/syncStudentsToRooms.js
```

## What It Does
1. Connects to MongoDB
2. Ensures room 001 exists
3. Fetches all students and rooms
4. Clears existing occupants
5. Matches students to rooms by `roomNumber`
6. Updates room `occupants` arrays
7. Respects 3-student capacity
8. Shows detailed summary

## Requirements
- ✅ MongoDB running
- ✅ 469 rooms exist (001, 101-139, 201-239, ..., 1201-1239)
- ✅ Students have `roomNumber` field populated

## Expected Result
```
✅ Students synced: 445
🏠 Total rooms: 469
👥 Total students: 450
```

## Verify
**MongoDB:**
```javascript
db.rooms.findOne({ roomNumber: "305" })
// Should show occupants array with student IDs
```

**Admin Portal:**
1. Go to Room Management
2. Click any room
3. See list of occupants

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No students found | Import students first |
| Missing rooms | Check room numbers in student data |
| Capacity warnings | Reassign students to available rooms |
| Room 001 missing | Script creates it automatically |

## Re-run Anytime
Safe to run multiple times - clears and re-syncs from scratch.

---

**Quick Command**: `node server/utils/syncStudentsToRooms.js`
