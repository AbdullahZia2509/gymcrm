const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const auth = require("../middleware/auth");
const tenant = require("../middleware/tenant");
const Member = require("../models/Member");
const Membership = require("../models/Membership");
const moment = require("moment");

// @route   GET api/members
// @desc    Get all members with optional pagination
// @access  Private
router.get("/", auth, tenant, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 0; // 0 means no limit
    const skip = parseInt(req.query.skip) || 0;
    const sort = req.query.sort || "firstName";
    const sortDirection = req.query.sortDirection === "desc" ? -1 : 1;

    const sortObj = {};
    sortObj[sort] = sortDirection;

    // Create query based on user role
    let query;
    if (req.user && req.user.role === "superadmin") {
      // Superadmin can see all members across all gyms
      query = Member.find();
    } else {
      // Filter by gym ID for multi-tenancy for non-superadmin users
      query = Member.find({ gym: req.gymId });
    }

    // Apply pagination if limit is specified
    if (limit > 0) {
      query.limit(limit).skip(skip);
    }

    // Apply sorting
    query.sort(sortObj);

    // Populate membership type information
    query.populate("membershipType", "name price duration");

    const members = await query.exec();
    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/members/search
// @desc    Search members by name, email, or phone
// @access  Private
router.get("/search", auth, tenant, async (req, res) => {
  try {
    const term = req.query.term || "";
    const limit = parseInt(req.query.limit) || 50;

    if (!term) {
      // If no search term, return limited results
      let query;
      if (req.user && req.user.role === "superadmin") {
        // Superadmin can see all members across all gyms
        query = Member.find();
      } else {
        // Filter by gym ID for non-superadmin users
        query = Member.find({ gym: req.gymId });
      }
      
      const members = await query
        .populate("membershipType", "name price duration")
        .sort({ firstName: 1 })
        .limit(limit);
      return res.json(members);
    }

    // Create a case-insensitive regex for the search term
    const searchRegex = new RegExp(term.split(" ").join("|"), "i");

    // Build search criteria
    let searchCriteria = {
      $or: [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        // Combine first and last name for full name search
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ["$firstName", " ", "$lastName"] },
              regex: searchRegex,
            },
          },
        },
      ]
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== "superadmin") {
      searchCriteria.gym = req.gymId;
    }
    
    const members = await Member.find(searchCriteria)
      .populate("membershipType", "name price duration")
      .sort({ firstName: 1 })
      .limit(limit);

    res.json(members);
  } catch (err) {
    console.error("Search error:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/members/recent
// @desc    Get recently added members for dashboard
// @access  Private
router.get("/recent", auth, tenant, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    let query;
    if (req.user && req.user.role === "superadmin") {
      // Superadmin can see all members across all gyms
      query = Member.find();
    } else {
      // Filter by gym ID for non-superadmin users
      query = Member.find({ gym: req.gymId });
    }
    
    const recentMembers = await query
      .populate("membershipType", "name")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(recentMembers);
  } catch (err) {
    console.error("Error fetching recent members:", err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/members/fees-due
// @desc    Get members with fees due (membership ending within 7 days or already expired)
// @access  Private
router.get("/fees-due", auth, tenant, async (req, res) => {
  try {
    const today = moment().startOf("day");
    const sevenDaysFromNow = moment().add(7, "days").endOf("day");

    // Build base query
    let query = {
      $or: [
        // Case 1: Membership ending within 7 days
        {
          endDate: {
            $gte: today.toDate(),
            $lte: sevenDaysFromNow.toDate(),
          },
        },
        // Case 2: Membership already ended but still active
        {
          endDate: { $lt: today.toDate() },
          membershipStatus: "active",
        },
      ]
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== "superadmin") {
      query.gym = req.gymId;
    }
    
    const members = await Member.find(query).populate("membershipType", "name price duration");

    // Calculate days remaining for each member
    const membersWithDueInfo = members.map((member) => {
      const memberObj = member.toObject();
      if (member.endDate) {
        const endDate = moment(member.endDate);
        const daysRemaining = endDate.diff(today, "days");
        memberObj.daysRemaining = daysRemaining;
        memberObj.dueStatus = daysRemaining < 0 ? "overdue" : "due-soon";
      } else {
        memberObj.daysRemaining = null;
        memberObj.dueStatus = "unknown";
      }
      return memberObj;
    });

    res.json(membersWithDueInfo);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/members/:id
// @desc    Get member by ID
// @access  Private
router.get("/:id", auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== "superadmin") {
      query.gym = req.gymId;
    }
    
    const member = await Member.findOne(query).populate("membershipType");

    if (!member) {
      return res.status(404).json({ msg: "Member not found" });
    }

    res.json(member);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Member not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   POST api/members
// @desc    Create a member
// @access  Private
router.post(
  "/",
  [
    auth,
    tenant,
    [
      check("firstName", "First name is required").not().isEmpty(),
      check("lastName", "Last name is required").not().isEmpty(),
      check("email", "Please include a valid email").isEmail(),
      check("phone", "Phone number is required").not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Build query to check for existing member with same email
      let existingMemberQuery = { email: req.body.email };
      
      // Add gym filter for non-superadmin users
      if (req.user && req.user.role !== "superadmin") {
        existingMemberQuery.gym = req.gymId;
      }
      
      // Check if member with email already exists
      let existingMember = await Member.findOne(existingMemberQuery);
      if (existingMember) {
        return res
          .status(400)
          .json({ msg: "Member with this email already exists" });
      }

      // Create new member data object
      const memberData = { ...req.body };

      // Handle membership type validation
      if (memberData.membershipType) {
        // Only validate if membershipType is not empty
        if (memberData.membershipType.trim() !== "") {
          try {
            const membership = await Membership.findById(
              memberData.membershipType
            );
            if (!membership) {
              return res.status(404).json({ msg: "Membership type not found" });
            }
          } catch (err) {
            // If there's an error with the ObjectId, remove the field
            delete memberData.membershipType;
          }
        } else {
          // If empty string, remove the field
          delete memberData.membershipType;
        }
      }

      // Calculate end date if membership type and start date are provided
      if (req.body.membershipType && req.body.startDate) {
        try {
          const membership = await Membership.findById(req.body.membershipType);
          if (membership) {
            const startDate = new Date(req.body.startDate);
            const endDate = new Date(startDate);

            // Add duration based on unit
            switch (membership.duration.unit) {
              case "days":
                endDate.setDate(endDate.getDate() + membership.duration.value);
                break;
              case "weeks":
                endDate.setDate(
                  endDate.getDate() + membership.duration.value * 7
                );
                break;
              case "months":
                endDate.setMonth(
                  endDate.getMonth() + membership.duration.value
                );
                break;
              case "years":
                endDate.setFullYear(
                  endDate.getFullYear() + membership.duration.value
                );
                break;
              default:
                break;
            }

            req.body.endDate = endDate;
          }
        } catch (err) {
          console.error("Error calculating end date:", err);
          // If there's an error with the membership lookup, remove the field
          delete req.body.membershipType;
        }
      }

      // Add gym ID to member data
      memberData.gym = req.gymId;
      const member = new Member(memberData);
      await member.save();

      res.json(member);
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// @route   PUT api/members/:id
// @desc    Update a member
// @access  Private
router.put("/:id", auth, tenant, async (req, res) => {
  try {
    let member = await Member.findOne({
      _id: req.params.id,
      gym: req.gymId
    });

    if (!member) {
      return res.status(404).json({ msg: "Member not found" });
    }

    // Handle membership type validation
    if (req.body.membershipType) {
      // Only validate if membershipType is not empty
      if (req.body.membershipType.trim() !== "") {
        try {
          const membership = await Membership.findById(req.body.membershipType);
          if (!membership) {
            return res.status(404).json({ msg: "Membership type not found" });
          }
        } catch (err) {
          // If there's an error with the ObjectId, remove the field
          delete req.body.membershipType;
        }
      } else {
        // If empty string, remove the field
        delete req.body.membershipType;
      }
    }

    // Update member data
    const updateData = { ...req.body, updatedAt: Date.now() };

    // Calculate end date if membership type and start date are updated
    if (updateData.membershipType && updateData.startDate) {
      try {
        console.log("Looking up membership:", updateData.membershipType);
        const membership = await Membership.findById(updateData.membershipType);
        if (membership) {
          console.log("Found membership:", membership.name);
          const startDate = new Date(updateData.startDate);
          const endDate = new Date(startDate);

          // Add duration based on unit
          switch (membership.duration.unit) {
            case "days":
              endDate.setDate(endDate.getDate() + membership.duration.value);
              break;
            case "weeks":
              endDate.setDate(
                endDate.getDate() + membership.duration.value * 7
              );
              break;
            case "months":
              endDate.setMonth(endDate.getMonth() + membership.duration.value);
              break;
            case "years":
              endDate.setFullYear(
                endDate.getFullYear() + membership.duration.value
              );
              break;
            default:
              break;
          }

          updateData.endDate = endDate;
        }
      } catch (err) {
        console.error("Error calculating end date during update:", err);
        // If there's an error with the membership lookup, remove the field
        delete updateData.membershipType;
      }
    }

    member = await Member.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).populate("membershipType");

    res.json(member);
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Member not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   DELETE api/members/:id
// @desc    Delete a member
// @access  Private
router.delete("/:id", auth, tenant, async (req, res) => {
  try {
    let query = { _id: req.params.id };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== "superadmin") {
      query.gym = req.gymId;
    }
    
    const member = await Member.findOne(query);

    if (!member) {
      return res.status(404).json({ msg: "Member not found" });
    }

    await member.remove();

    res.json({ msg: "Member removed" });
  } catch (err) {
    console.error(err.message);
    if (err.kind === "ObjectId") {
      return res.status(404).json({ msg: "Member not found" });
    }
    res.status(500).send("Server Error");
  }
});

// @route   GET api/members/search
// @desc    Search members by name or email
// @access  Private
router.get("/search/:query", auth, tenant, async (req, res) => {
  try {
    const searchQuery = req.params.query;
    
    // Build search criteria
    let searchCriteria = {
      $or: [
        { firstName: { $regex: searchQuery, $options: "i" } },
        { lastName: { $regex: searchQuery, $options: "i" } },
        { email: { $regex: searchQuery, $options: "i" } },
      ]
    };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== "superadmin") {
      searchCriteria.gym = req.gymId;
    }
    
    const members = await Member.find(searchCriteria).populate("membershipType", "name price duration");

    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET api/members/status/:status
// @desc    Get members by status
// @access  Private
router.get("/status/:status", auth, tenant, async (req, res) => {
  try {
    let query = { membershipStatus: req.params.status };
    
    // Add gym filter for non-superadmin users
    if (req.user && req.user.role !== "superadmin") {
      query.gym = req.gymId;
    }
    
    const members = await Member.find(query).populate("membershipType", "name price duration");

    res.json(members);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
