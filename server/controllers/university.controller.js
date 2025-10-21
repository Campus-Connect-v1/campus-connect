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
