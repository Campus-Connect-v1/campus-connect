import db from "../config/db.js";

export const getUniversityDomainsModel = async (search = "") => {
  try {
    let query = `
      SELECT university_id, name, domain, logo_url, city, state, country, primary_color,
        secondary_color,
        accent_color,
        text_color
      FROM universities 
      WHERE is_verified = 1
    `;

    const params = [];

    if (search && search.trim() !== "") {
      query += ` AND (name LIKE ? OR domain LIKE ? OR city LIKE ?)`;
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ` ORDER BY name ASC LIMIT 100`; // Limit to 100 results for dropdown

    const [rows] = await db.execute(query, params);
    return rows;
  } catch (error) {
    console.error("Get university domains model error:", error);
    throw error;
  }
};

// =====================  CAMPUS BUILDING  ======================

export class CampusBuilding {
  // Get all buildings for a university
  static async findByUniversity(universityId, buildingType = null) {
    let query = `
      SELECT * FROM campus_buildings 
      WHERE university_id = ?
    `;
    const params = [universityId];

    if (buildingType) {
      query += " AND building_type = ?";
      params.push(buildingType);
    }

    query += " ORDER BY building_name";

    const [buildings] = await db.execute(query, params);
    return buildings;
  }

  // Get building by ID
  static async findById(buildingId) {
    const query = `
      SELECT cb.*, uni.name as university_name
      FROM campus_buildings cb
      JOIN universities uni ON cb.university_id = uni.university_id
      WHERE cb.building_id = ?
    `;
    const [buildings] = await db.execute(query, [buildingId]);
    return buildings[0] || null;
  }

  // Get buildings by type
  static async findByType(universityId, buildingType) {
    const query = `
      SELECT * FROM campus_buildings 
      WHERE university_id = ? AND building_type = ?
      ORDER BY building_name
    `;
    const [buildings] = await db.execute(query, [universityId, buildingType]);
    return buildings;
  }

  // Search buildings
  static async search(universityId, searchTerm) {
    const query = `
      SELECT * FROM campus_buildings 
      WHERE university_id = ? AND (
        building_name LIKE ? OR 
        building_code LIKE ? OR
        description LIKE ?
      )
      ORDER BY building_name
    `;
    const searchPattern = `%${searchTerm}%`;
    const [buildings] = await db.execute(query, [
      universityId,
      searchPattern,
      searchPattern,
      searchPattern,
    ]);
    return buildings;
  }
}

// module.exports = CampusBuilding;

// =====================  FACILITIES ======================
export class CampusFacility {
  // Get facilities by building
  static async findByBuilding(buildingId, facilityType = null) {
    let query = `
      SELECT cf.*, cb.building_name, cb.building_code
      FROM campus_facilities cf
      JOIN campus_buildings cb ON cf.building_id = cb.building_id
      WHERE cf.building_id = ?
    `;
    const params = [buildingId];

    if (facilityType) {
      query += " AND cf.facility_type = ?";
      params.push(facilityType);
    }

    query += " ORDER BY cf.floor, cf.room_number";

    const [facilities] = await db.execute(query, params);
    return facilities;
  }

  // Get facility by ID
  static async findById(facilityId) {
    const query = `
      SELECT cf.*, cb.building_name, cb.building_code, cb.building_type,
             uni.name as university_name
      FROM campus_facilities cf
      JOIN campus_buildings cb ON cf.building_id = cb.building_id
      JOIN universities uni ON cb.university_id = uni.university_id
      WHERE cf.facility_id = ?
    `;
    const [facilities] = await db.execute(query, [facilityId]);
    return facilities[0] || null;
  }

  // Get facilities by type
  static async findByType(universityId, facilityType) {
    const query = `
      SELECT cf.*, cb.building_name, cb.building_code
      FROM campus_facilities cf
      JOIN campus_buildings cb ON cf.building_id = cb.building_id
      WHERE cb.university_id = ? AND cf.facility_type = ?
      ORDER BY cb.building_name, cf.floor, cf.room_number
    `;
    const [facilities] = await db.execute(query, [universityId, facilityType]);
    return facilities;
  }

  // Search facilities
  static async search(universityId, searchTerm) {
    const query = `
      SELECT cf.*, cb.building_name, cb.building_code
      FROM campus_facilities cf
      JOIN campus_buildings cb ON cf.building_id = cb.building_id
      WHERE cb.university_id = ? AND (
        cf.facility_name LIKE ? OR 
        cf.description LIKE ? OR
        cb.building_name LIKE ?
      )
      ORDER BY cb.building_name, cf.floor, cf.room_number
    `;
    const searchPattern = `%${searchTerm}%`;
    const [facilities] = await db.execute(query, [
      universityId,
      searchPattern,
      searchPattern,
      searchPattern,
    ]);
    return facilities;
  }

  // Get reservable facilities
  static async getReservable(universityId) {
    const query = `
      SELECT cf.*, cb.building_name, cb.building_code
      FROM campus_facilities cf
      JOIN campus_buildings cb ON cf.building_id = cb.building_id
      WHERE cb.university_id = ? AND cf.is_reservable = true
      ORDER BY cb.building_name, cf.facility_name
    `;
    const [facilities] = await db.execute(query, [universityId]);
    return facilities;
  }
}

// module.exports = CampusFacility;
