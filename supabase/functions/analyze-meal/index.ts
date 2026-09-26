import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { mealDescription, imageBase64 } = await req.json();

    if (!mealDescription && !imageBase64) {
      throw new Error("Meal description or image is required");
    }

    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      throw new Error("Authorization header is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("User not authenticated");
    }

    const systemInstruction = `You are an expert nutritionist and food analyst.

Analyze the meal description or image and provide nutritional estimates based on standard food databases and typical serving sizes.

Return ONLY a valid JSON object with this exact structure:

{
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "meal_type": "breakfast/lunch/dinner/snack"
}

Rules:
- Estimate calories and macronutrients using standard portion sizes.
- If quantities or portions are specified, use those measurements.
- If no quantity is specified, assume a standard serving size.
- Break composite meals into individual components when estimating nutrition.
- Determine the most appropriate meal type.
- Return ONLY the JSON object. Do not include markdown or explanations.`;

    const parts: Array<Record<string, unknown>> = [];

    if (mealDescription) {
      parts.push({
        text: imageBase64
          ? `Analyze this meal image. Additional context: ${mealDescription}`
          : `Analyze this meal: ${mealDescription}`,
      });
    } else {
      parts.push({
        text: "Analyze this meal image and identify all food items visible.",
      });
    }

    if (imageBase64) {
      parts.push({
        inline_data: {
          mime_type: "image/jpeg",
          data: imageBase64,
        },
      });
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": Deno.env.get("GEMINI_API_KEY") ?? "",
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: "user",
              parts,
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error("Failed to analyze meal");
    }

    const aiData = await response.json();

    const aiResponse =
      aiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!aiResponse) {
      console.error(
        "Unexpected Gemini response:",
        JSON.stringify(aiData)
      );
      throw new Error("Invalid response from Gemini");
    }

    let nutritionData;

    try {
      nutritionData = JSON.parse(aiResponse);
    } catch (error) {
      console.error("Failed to parse AI response:", aiResponse);
      throw new Error("Invalid response from AI");
    }

    const { error: mealError } = await supabaseClient
      .from("meals")
      .insert({
        user_id: user.id,
        meal_description: mealDescription,
        calories: nutritionData.calories,
        protein_g: nutritionData.protein_g,
        carbs_g: nutritionData.carbs_g,
        fats_g: nutritionData.fats_g,
        meal_type: nutritionData.meal_type,
      });

    if (mealError) {
      throw mealError;
    }

    const today = new Date().toISOString().split("T")[0];

    const { data: existingSummary } = await supabaseClient
      .from("daily_nutrition_summary")
      .select("*")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (existingSummary) {
      await supabaseClient
        .from("daily_nutrition_summary")
        .update({
          total_calories:
            existingSummary.total_calories + nutritionData.calories,
          total_protein_g:
            existingSummary.total_protein_g + nutritionData.protein_g,
          total_carbs_g:
            existingSummary.total_carbs_g + nutritionData.carbs_g,
          total_fats_g:
            existingSummary.total_fats_g + nutritionData.fats_g,
          meals_count: existingSummary.meals_count + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingSummary.id);
    } else {
      await supabaseClient
        .from("daily_nutrition_summary")
        .insert({
          user_id: user.id,
          date: today,
          total_calories: nutritionData.calories,
          total_protein_g: nutritionData.protein_g,
          total_carbs_g: nutritionData.carbs_g,
          total_fats_g: nutritionData.fats_g,
          meals_count: 1,
        });
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: nutritionData,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in analyze-meal:", error);

    const errorMessage =
      error instanceof Error ? error.message : "An error occurred";

    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});