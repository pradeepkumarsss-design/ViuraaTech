import { Hono } from "npm:hono@4.6.14";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Middleware
app.use("*", cors());
app.use("*", logger(console.log));

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Health check endpoint
app.get("/make-server-98d69961/health", (c) => {
  return c.json({ status: "ok" });
});

// Initialize admin credentials on first run
app.post("/make-server-98d69961/init-admin", async (c) => {
  try {
    console.log("Checking admin credentials...");
    
    // Check if credentials already exist
    const existingCreds = await kv.get("admin:credentials");
    
    if (!existingCreds) {
      // Store default admin credentials
      await kv.set("admin:credentials", {
        username: "viuraatech",
        password: "nAture@iNtern88"
      });
      console.log("Admin credentials initialized");
      return c.json({ success: true, message: "Credentials initialized" });
    }
    
    console.log("Admin credentials already exist");
    return c.json({ success: true, message: "Credentials already exist" });
  } catch (error) {
    console.log(`Error initializing admin credentials: ${error.message}`);
    return c.json(
      { success: false, error: `Failed to initialize credentials: ${error.message}` },
      500
    );
  }
});

// Admin login endpoint
app.post("/make-server-98d69961/admin-login", async (c) => {
  try {
    const { username, password } = await c.req.json();
    console.log(`Admin login attempt for username: ${username}`);
    
    if (!username || !password) {
      return c.json(
        { success: false, error: "Username and password are required" },
        400
      );
    }
    
    // Get stored credentials
    const storedCreds = await kv.get("admin:credentials");
    
    if (!storedCreds) {
      // Initialize if not exists
      await kv.set("admin:credentials", {
        username: "viuraatech",
        password: "nAture@iNtern88"
      });
      console.log("Admin credentials auto-initialized during login");
      
      // Check again
      const newCreds = await kv.get("admin:credentials");
      if (username === newCreds.username && password === newCreds.password) {
        console.log("Admin login successful");
        return c.json({ success: true, message: "Login successful" });
      }
    }
    
    // Validate credentials
    if (username === storedCreds.username && password === storedCreds.password) {
      console.log("Admin login successful");
      return c.json({ success: true, message: "Login successful" });
    }
    
    console.log("Invalid admin credentials");
    return c.json(
      { success: false, error: "Invalid username or password" },
      401
    );
  } catch (error) {
    console.log(`Admin login failed: ${error.message}`);
    return c.json(
      { success: false, error: `Login failed: ${error.message}` },
      500
    );
  }
});

// Upload resume endpoint
app.post("/make-server-98d69961/upload-resume", async (c) => {
  try {
    const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);
    const bucketName = "make-98d69961-resumes";

    // Check if bucket exists, create if not
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName);

    if (!bucketExists) {
      console.log(`Creating bucket: ${bucketName}`);
      const { error: createError } = await supabase.storage.createBucket(bucketName, {
        public: false,
        fileSizeLimit: 10485760, // 10MB
      });
      
      if (createError) {
        console.log(`Error creating bucket: ${createError.message}`);
        return c.json(
          { success: false, error: `Failed to create storage bucket: ${createError.message}` },
          500
        );
      }
    }

    // Get file from form data
    const formData = await c.req.formData();
    const file = formData.get("file") as File;
    const filePath = formData.get("filePath") as string;

    if (!file || !filePath) {
      return c.json({ success: false, error: "File or file path missing" }, 400);
    }

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.log(`File upload error: ${uploadError.message}`);
      return c.json(
        { success: false, error: `File upload failed: ${uploadError.message}` },
        500
      );
    }

    // Generate signed URL (valid for 1 year)
    const { data: urlData, error: urlError } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(filePath, 31536000);

    if (urlError) {
      console.log(`Error creating signed URL: ${urlError.message}`);
      return c.json(
        { success: false, error: `Failed to create signed URL: ${urlError.message}` },
        500
      );
    }

    console.log(`Resume uploaded successfully: ${filePath}`);
    return c.json({ success: true, signedUrl: urlData.signedUrl, path: uploadData.path });
  } catch (error) {
    console.log(`Resume upload failed: ${error.message}`);
    return c.json(
      { success: false, error: `Resume upload failed: ${error.message}` },
      500
    );
  }
});

// Submit application endpoint
app.post("/make-server-98d69961/submit-application", async (c) => {
  try {
    const data = await c.req.json();
    console.log(`Received application submission${data.testMode ? ' (TEST MODE)' : ''}:`, data.fullName);
    
    const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

    // Check for duplicate phone numbers (skip in test mode)
    if (!data.testMode) {
      try {
        const existingApplications = await kv.getByPrefix("application:");
        const phoneExists = existingApplications.some(
          (app: any) => app.phoneNumber === data.phoneNumber
        );

        if (phoneExists) {
          console.log(`Duplicate phone number detected: ${data.phoneNumber}`);
          return c.json(
            {
              success: false,
              error: "This phone number is already registered. Please use a different phone number.",
            },
            400
          );
        }
      } catch (error) {
        console.log(`Error checking for duplicate phone numbers: ${error.message}`);
        return c.json(
          {
            success: false,
            error: `Phone number validation failed: ${error.message}`,
          },
          500
        );
      }
    }

    // Generate application ID
    const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Remove testMode flag before storing
    const { testMode, ...applicationDataToStore } = data;

    // Store application data
    const applicationData = {
      ...applicationDataToStore,
      applicationId,
      submittedAt: new Date().toISOString(),
    };

    try {
      await kv.set(`application:${applicationId}`, applicationData);
      console.log(`Application stored successfully: ${applicationId}${testMode ? ' (TEST MODE)' : ''}`);
    } catch (error) {
      console.log(`Error storing application: ${error.message}`);
      return c.json(
        {
          success: false,
          error: `Failed to store application: ${error.message}`,
        },
        500
      );
    }

    return c.json({
      success: true,
      applicationId,
      applicationData,
    });
  } catch (error) {
    console.log(`Application submission failed: ${error.message}`);
    return c.json(
      {
        success: false,
        error: `Application submission failed: ${error.message}`,
      },
      500
    );
  }
});

// Get all applications endpoint
app.get("/make-server-98d69961/get-applications", async (c) => {
  try {
    console.log("Fetching all applications...");
    
    const applications = await kv.getByPrefix("application:");
    
    // Sort by submission date (newest first)
    applications.sort((a: any, b: any) => {
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
    });
    
    console.log(`Found ${applications.length} applications`);
    
    return c.json({
      success: true,
      applications,
      count: applications.length,
    });
  } catch (error) {
    console.log(`Error fetching applications: ${error.message}`);
    return c.json(
      {
        success: false,
        error: `Failed to fetch applications: ${error.message}`,
      },
      500
    );
  }
});

// Check in endpoint
app.post("/make-server-98d69961/check-in", async (c) => {
  try {
    const { applicationId } = await c.req.json();
    console.log(`Processing check-in for: ${applicationId}`);

    if (!applicationId) {
      return c.json(
        { success: false, error: "Application ID is required" },
        400
      );
    }

    // Get the application
    const applications = await kv.getByPrefix(`application:${applicationId}`);
    
    if (!applications || applications.length === 0) {
      return c.json(
        { success: false, error: "Application not found" },
        404
      );
    }

    const application = applications[0];

    // Check if already checked in
    if (application.checkInTime) {
      return c.json(
        { 
          success: false, 
          error: "Already checked in",
          checkInTime: application.checkInTime 
        },
        400
      );
    }

    // Update with check-in time
    const checkInTime = new Date().toISOString();
    const updatedApplication = {
      ...application,
      checkInTime,
    };

    await kv.set(`application:${applicationId}`, updatedApplication);
    console.log(`Check-in successful for ${applicationId} at ${checkInTime}`);

    return c.json({
      success: true,
      checkInTime,
      applicationId,
    });
  } catch (error) {
    console.log(`Check-in failed: ${error.message}`);
    return c.json(
      {
        success: false,
        error: `Check-in failed: ${error.message}`,
      },
      500
    );
  }
});

// Check out endpoint
app.post("/make-server-98d69961/check-out", async (c) => {
  try {
    const { applicationId } = await c.req.json();
    console.log(`Processing check-out for: ${applicationId}`);

    if (!applicationId) {
      return c.json(
        { success: false, error: "Application ID is required" },
        400
      );
    }

    // Get the application
    const applications = await kv.getByPrefix(`application:${applicationId}`);
    
    if (!applications || applications.length === 0) {
      return c.json(
        { success: false, error: "Application not found" },
        404
      );
    }

    const application = applications[0];

    // Check if checked in
    if (!application.checkInTime) {
      return c.json(
        { success: false, error: "Not checked in yet" },
        400
      );
    }

    // Check if already checked out
    if (application.checkOutTime) {
      return c.json(
        { 
          success: false, 
          error: "Already checked out",
          checkOutTime: application.checkOutTime 
        },
        400
      );
    }

    // Update with check-out time
    const checkOutTime = new Date().toISOString();
    const updatedApplication = {
      ...application,
      checkOutTime,
    };

    await kv.set(`application:${applicationId}`, updatedApplication);
    console.log(`Check-out successful for ${applicationId} at ${checkOutTime}`);

    return c.json({
      success: true,
      checkOutTime,
      applicationId,
    });
  } catch (error) {
    console.log(`Check-out failed: ${error.message}`);
    return c.json(
      {
        success: false,
        error: `Check-out failed: ${error.message}`,
      },
      500
    );
  }
});

// Save comments endpoint
app.post("/make-server-98d69961/save-comments", async (c) => {
  try {
    const { applicationId, comments } = await c.req.json();
    console.log(`Saving comments for: ${applicationId}`);

    if (!applicationId) {
      return c.json(
        { success: false, error: "Application ID is required" },
        400
      );
    }

    // Get the application
    const applications = await kv.getByPrefix(`application:${applicationId}`);
    
    if (!applications || applications.length === 0) {
      return c.json(
        { success: false, error: "Application not found" },
        404
      );
    }

    const application = applications[0];

    // Update with comments
    const updatedApplication = {
      ...application,
      comments: comments || "",
      lastCommentUpdate: new Date().toISOString(),
    };

    await kv.set(`application:${applicationId}`, updatedApplication);
    console.log(`Comments saved for ${applicationId}`);

    return c.json({
      success: true,
      applicationId,
      comments,
    });
  } catch (error) {
    console.log(`Save comments failed: ${error.message}`);
    return c.json(
      {
        success: false,
        error: `Save comments failed: ${error.message}`,
      },
      500
    );
  }
});

// Save announcement text
app.post("/make-server-98d69961/announcement", async (c) => {
  try {
    const { text } = await c.req.json();
    console.log(`Saving announcement text: ${text}`);
    
    await kv.set("announcement:text", text || "");
    
    return c.json({ success: true, message: "Announcement saved" });
  } catch (error) {
    console.log(`Error saving announcement: ${error.message}`);
    return c.json(
      { success: false, error: `Failed to save announcement: ${error.message}` },
      500
    );
  }
});

// Get announcement text
app.get("/make-server-98d69961/announcement", async (c) => {
  try {
    const text = await kv.get("announcement:text");
    console.log(`Retrieved announcement text: ${text}`);
    
    return c.json({ success: true, text: text || "" });
  } catch (error) {
    console.log(`Error retrieving announcement: ${error.message}`);
    return c.json(
      { success: false, error: `Failed to retrieve announcement: ${error.message}` },
      500
    );
  }
});

// Submit internship application
app.post("/make-server-98d69961/submit-internship-application", async (c) => {
  try {
    const data = await c.req.json();
    console.log(`Received internship application submission${data.testMode ? ' (TEST MODE)' : ''}:`, data.fullName);
    
    const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!);

    // Check for duplicate phone numbers (skip in test mode)
    if (!data.testMode) {
      try {
        const existingApplications = await kv.getByPrefix("application:");
        const phoneExists = existingApplications.some(
          (app: any) => app.phoneNumber === data.phoneNumber
        );

        if (phoneExists) {
          console.log(`Duplicate phone number detected: ${data.phoneNumber}`);
          return c.json(
            {
              success: false,
              error: "This phone number is already registered. Please use a different phone number.",
            },
            400
          );
        }
      } catch (error) {
        console.log(`Error checking for duplicate phone numbers: ${error.message}`);
        return c.json(
          {
            success: false,
            error: `Phone number validation failed: ${error.message}`,
          },
          500
        );
      }
    }

    // Generate application ID
    const applicationId = `APP-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Remove testMode flag before storing
    const { testMode, ...applicationDataToStore } = data;

    // Store application data
    const applicationData = {
      ...applicationDataToStore,
      applicationId,
      submittedAt: new Date().toISOString(),
    };

    try {
      await kv.set(`application:${applicationId}`, applicationData);
      console.log(`Application stored successfully: ${applicationId}${testMode ? ' (TEST MODE)' : ''}`);
    } catch (error) {
      console.log(`Error storing application: ${error.message}`);
      return c.json(
        {
          success: false,
          error: `Failed to store application: ${error.message}`,
        },
        500
      );
    }

    return c.json({
      success: true,
      applicationId,
      applicationData,
    });
  } catch (error) {
    console.log(`Application submission failed: ${error.message}`);
    return c.json(
      {
        success: false,
        error: `Application submission failed: ${error.message}`,
      },
      500
    );
  }
});

// Start the server
Deno.serve(app.fetch);