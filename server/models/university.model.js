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
