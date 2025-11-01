const Room = require('../models/Room');
const Student = require('../models/StudentModel');

/**
 * Extract floor number from room number
 * Examples: 101 -> 1, 1201 -> 12
 */
function extractFloorNumber(roomNumber) {
    const roomStr = roomNumber.toString();
    
    // For rooms 1001-1239 (floors 10-12)
    if (roomStr.length === 4 && roomStr.startsWith('1')) {
        return parseInt(roomStr.substring(0, 2));
    }
    
    // For rooms 101-939 (floors 1-9)
    return parseInt(roomStr.charAt(0));
}

/**
 * Generate all 468 hostel rooms based on the floor and room numbering pattern
 * 12 floors × 39 rooms per floor = 468 total rooms
 */
async function generateAllRooms() {
    const TOTAL_FLOORS = 12;
    const ROOMS_PER_FLOOR = 39;
    const DEFAULT_CAPACITY = 3;
    
    const roomsToCreate = [];
    const existingRoomNumbers = new Set();
    
    // Get all existing rooms
    const existingRooms = await Room.find({}, 'roomNumber');
    existingRooms.forEach(room => existingRoomNumbers.add(room.roomNumber));
    
    // Generate room numbers for all floors
    for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
        for (let roomNum = 1; roomNum <= ROOMS_PER_FLOOR; roomNum++) {
            let roomNumber;
            
            // Room numbering pattern
            if (floor < 10) {
                // Floors 1-9: 101-139, 201-239, ..., 901-939
                roomNumber = `${floor}${roomNum.toString().padStart(2, '0')}`;
            } else {
                // Floors 10-12: 1001-1039, 1101-1139, 1201-1239
                roomNumber = `${floor}${roomNum.toString().padStart(2, '0')}`;
            }
            
            // Only create if room doesn't exist
            if (!existingRoomNumbers.has(roomNumber)) {
                roomsToCreate.push({
                    roomNumber,
                    floor,
                    capacity: DEFAULT_CAPACITY,
                    occupants: [],
                    allocatedStudents: []
                });
            }
        }
    }
    
    // Bulk insert new rooms
    if (roomsToCreate.length > 0) {
        await Room.insertMany(roomsToCreate);
        console.log(`✅ Created ${roomsToCreate.length} new rooms`);
    } else {
        console.log('ℹ️ All rooms already exist');
    }
    
    return {
        created: roomsToCreate.length,
        total: TOTAL_FLOORS * ROOMS_PER_FLOOR
    };
}

/**
 * Sync students to their rooms based on roomNumber field in student collection
 */
async function syncStudentsToRooms() {
    try {
        // Get all students with room numbers
        const studentsWithRooms = await Student.find({
            roomNumber: { $exists: true, $ne: null, $ne: '' },
            is_active: true
        });
        
        console.log(`📊 Found ${studentsWithRooms.length} students with room assignments`);
        
        // Extract unique room numbers from students
        const uniqueRoomNumbers = [...new Set(studentsWithRooms.map(s => s.roomNumber))];
        console.log(`🏠 Unique room numbers in student data: ${uniqueRoomNumbers.length}`);
        
        // Create any missing rooms from student data
        const createdRooms = [];
        for (const roomNumber of uniqueRoomNumbers) {
            const existingRoom = await Room.findOne({ roomNumber });
            
            if (!existingRoom) {
                const floor = extractFloorNumber(roomNumber);
                const newRoom = await Room.create({
                    roomNumber,
                    floor,
                    capacity: 3,
                    occupants: [],
                    allocatedStudents: []
                });
                createdRooms.push(newRoom);
                console.log(`✨ Created room ${roomNumber} from student data`);
            }
        }
        
        // Clear all room occupants first (to avoid duplicates)
        await Room.updateMany({}, { $set: { occupants: [], allocatedStudents: [] } });
        console.log('🧹 Cleared all room occupants');
        
        // Group students by room number
        const studentsByRoom = {};
        studentsWithRooms.forEach(student => {
            if (!studentsByRoom[student.roomNumber]) {
                studentsByRoom[student.roomNumber] = [];
            }
            studentsByRoom[student.roomNumber].push(student._id);
        });
        
        // Update each room with its students
        let updatedRooms = 0;
        for (const [roomNumber, studentIds] of Object.entries(studentsByRoom)) {
            await Room.findOneAndUpdate(
                { roomNumber },
                { 
                    $set: { 
                        occupants: studentIds,
                        allocatedStudents: studentIds
                    } 
                }
            );
            updatedRooms++;
        }
        
        console.log(`✅ Updated ${updatedRooms} rooms with student allocations`);
        
        return {
            studentsProcessed: studentsWithRooms.length,
            roomsCreated: createdRooms.length,
            roomsUpdated: updatedRooms,
            uniqueRooms: uniqueRoomNumbers.length
        };
    } catch (error) {
        console.error('❌ Error syncing students to rooms:', error);
        throw error;
    }
}

/**
 * Get all rooms with their allocated students (populated)
 */
async function getAllRoomsWithStudents() {
    try {
        const rooms = await Room.find()
            .populate('occupants', 'name rollNumber branch year phoneNumber email parentMobileNumber')
            .sort({ roomNumber: 1 });
        
        // Add computed fields
        const roomsWithDetails = rooms.map(room => ({
            ...room.toObject(),
            floor: room.floor,
            currentOccupancy: room.occupants.length,
            availableBeds: room.capacity - room.occupants.length,
            isFullyOccupied: room.occupants.length >= room.capacity,
            isVacant: room.occupants.length === 0
        }));
        
        return roomsWithDetails;
    } catch (error) {
        console.error('❌ Error fetching rooms with students:', error);
        throw error;
    }
}

/**
 * Get rooms grouped by floor
 */
async function getRoomsByFloor() {
    try {
        const rooms = await getAllRoomsWithStudents();
        
        // Group by floor
        const roomsByFloor = {};
        rooms.forEach(room => {
            if (!roomsByFloor[room.floor]) {
                roomsByFloor[room.floor] = [];
            }
            roomsByFloor[room.floor].push(room);
        });
        
        return roomsByFloor;
    } catch (error) {
        console.error('❌ Error grouping rooms by floor:', error);
        throw error;
    }
}

/**
 * Get statistics about room occupancy
 */
async function getRoomStatistics() {
    try {
        const rooms = await Room.find();
        
        const stats = {
            totalRooms: rooms.length,
            totalCapacity: rooms.reduce((sum, room) => sum + room.capacity, 0),
            totalOccupied: rooms.reduce((sum, room) => sum + room.occupants.length, 0),
            fullyOccupiedRooms: rooms.filter(r => r.occupants.length >= r.capacity).length,
            partiallyOccupiedRooms: rooms.filter(r => r.occupants.length > 0 && r.occupants.length < r.capacity).length,
            vacantRooms: rooms.filter(r => r.occupants.length === 0).length,
            occupancyRate: 0
        };
        
        stats.occupancyRate = stats.totalCapacity > 0 
            ? ((stats.totalOccupied / stats.totalCapacity) * 100).toFixed(2)
            : 0;
        
        return stats;
    } catch (error) {
        console.error('❌ Error calculating room statistics:', error);
        throw error;
    }
}

module.exports = {
    generateAllRooms,
    syncStudentsToRooms,
    getAllRoomsWithStudents,
    getRoomsByFloor,
    getRoomStatistics,
    extractFloorNumber
};
