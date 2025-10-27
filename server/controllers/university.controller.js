import { getUniversityDomainsModel } from "../models/university.model.js";

export const getUniversityDomains = async (req, res) => {
  try {
    const { search = "" } = req.query;

    const universities = await getUniversityDomainsModel(search);

    const dropdownOptions = universities.map((uni) => ({
      value: uni.domain,
      label: uni.name,
      university_id: uni.university_id,
      logo_url: uni.logo_url,
      location: [uni.city, uni.state, uni.country]
        .filter(Boolean) // Remove null/empty values
        .join(", "),
      colors: {
        primary: uni.primary_color || "#000000",
        secondary: uni.secondary_color || "#FFFFFF",
        accent: uni.accent_color || "#666666",
        text: uni.text_color || "#333333",
      },
    }));
    if (universities.length === 0) {
      return res.status(200).json({
        message: "No universities found",
        count: 0,
        universities: [],
      });
    }

    res.status(200).json({
      message: "University domains retrieved successfully",
      count: universities.length,
      universities: dropdownOptions,
    });
  } catch (error) {
    console.error("Get university domains error:", error);
    res.status(500).json({
      message: "Failed to retrieve university domains",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// ================ CAMPUS CONTROLLER ==========================
import { CampusBuilding } from "../models/university.model.js";
import { CampusFacility } from "../models/university.model.js";

export const campusController = {
  // Get all buildings for university
  getBuildings: async (req, res) => {
    try {
      const { university_id } = req.params;
      const { building_type } = req.query;

      const buildings = await CampusBuilding.findByUniversity(
        university_id,
        building_type
      );

      res.json({
        success: true,
        count: buildings.length,
        data: buildings,
      });
    } catch (error) {
      console.error("Get buildings error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching buildings",
        error: error.message,
      });
    }
  },

  // Get building by ID
  getBuildingById: async (req, res) => {
    try {
      const { buildingId } = req.params;
      const building = await CampusBuilding.findById(buildingId);

      if (!building) {
        return res.status(404).json({
          success: false,
          message: "Building not found",
        });
      }

      res.json({
        success: true,
        data: building,
      });
    } catch (error) {
      console.error("Get building error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching building",
        error: error.message,
      });
    }
  },

  // Search buildings
  searchBuildings: async (req, res) => {
    try {
      const { university_id } = req.params;
      const { q: searchTerm } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: "Search term is required",
          example: "Add ?q=science to your query string",
        });
      }

      const buildings = await CampusBuilding.search(university_id, searchTerm);

      if (buildings.length === 0) {
        return res.json({
          success: true,
          data: buildings,
          message: `No building called -- ${searchTerm} -- was found`,
        });
      }
      res.json({
        success: true,
        data: buildings,
      });
    } catch (error) {
      console.error("Search buildings error:", error);
      res.status(500).json({
        success: false,
        message: "Error searching buildings",
        error: error.message,
      });
    }
  },

  // Get facilities by building
  getFacilitiesByBuilding: async (req, res) => {
    try {
      const { buildingId } = req.params;
      const { facility_type } = req.query;

      const facilities = await CampusFacility.findByBuilding(
        buildingId,
        facility_type
      );

      res.json({
        success: true,
        data: facilities,
      });
    } catch (error) {
      console.error("Get facilities error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching facilities",
        error: error.message,
      });
    }
  },

  // Get facility by ID
  getFacilityById: async (req, res) => {
    try {
      const { facilityId } = req.params;
      const facility = await CampusFacility.findById(facilityId);

      if (!facility) {
        return res.status(404).json({
          success: false,
          message: "Facility not found",
        });
      }

      res.json({
        success: true,
        data: facility,
      });
    } catch (error) {
      console.error("Get facility error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching facility",
        error: error.message,
      });
    }
  },

  // Search facilities
  searchFacilities: async (req, res) => {
    try {
      const { university_id } = req.params;
      const { q: searchTerm } = req.query;

      if (!searchTerm) {
        return res.status(400).json({
          success: false,
          message: "Search term is required",
          example: "Add ?q=facility to your query string",
        });
      }

      const facilities = await CampusFacility.search(university_id, searchTerm);
      if (facilities.length === 0) {
        return res.json({
          success: true,
          message: `No facility with query -- ${searchTerm} -- was found`,
        });
      }
      res.json({
        success: true,
        count: facilities.length,
        data: facilities,
      });
    } catch (error) {
      console.error("Search facilities error:", error);
      res.status(500).json({
        success: false,
        message: "Error searching facilities",
        error: error.message,
      });
    }
  },

  // Get facilities by type
  getFacilitiesByType: async (req, res) => {
    try {
      const { university_id } = req.params;
      const { facility_type } = req.query;

      if (!facility_type) {
        return res.status(400).json({
          success: false,
          message: "Facility type is required",
        });
      }

      const facilities = await CampusFacility.findByType(
        university_id,
        facility_type
      );
      if (facilities.length === 0) {
        return res.json({
          success: true,
          message: `No facility of type -- ${facility_type} -- was found`,
        });
      }
      res.json({
        success: true,
        count: facilities.length,
        data: facilities,
      });
    } catch (error) {
      console.error("Get facilities by type error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching facilities by type",
        error: error.message,
      });
    }
  },

  // Get reservable facilities
  getReservableFacilities: async (req, res) => {
    try {
      const { university_id } = req.params;

      const facilities = await CampusFacility.getReservable(university_id);
      if (facilities.length === 0) {
        return res.json({
          success: true,
          message: `No reservable facilities were found`,
        });
      }
      res.json({
        success: true,
        count: facilities.length,
        data: facilities,
      });
    } catch (error) {
      console.error("Get reservable facilities error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching reservable facilities",
        error: error.message,
      });
    }
  },
};
