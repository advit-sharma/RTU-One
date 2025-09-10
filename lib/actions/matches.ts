"use server";

import { UserProfile } from "@/app/profile/page";
import { createClient } from "../supabase/server";

export async function getPotentialMatches(): Promise<UserProfile[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { data: potentialMatches, error } = await supabase
    .from("users")
    .select("*")
    .neq("id", user.id)
    .limit(50);

  if (error) {
    throw new Error("failed to fetch potential matches");
  }

  const { data: userPrefs, error: prefsError } = await supabase
    .from("users")
    .select("preferences")
    .eq("id", user.id)
    .single();

  if (prefsError) {
    throw new Error("Failed to get user preferences");
  }

  const currentUserPrefs = userPrefs.preferences as any;
  const genderPreference = currentUserPrefs?.gender_preference || [];
  const filteredMatches =
    potentialMatches
      .filter((match) => {
        if (!genderPreference || genderPreference.length === 0) {
          return true;
        }

        return genderPreference.includes(match.gender);
      })
      .map((match) => ({
        id: match.id,
        full_name: match.full_name,
        username: match.username,
        email: "",
        gender: match.gender,
        birthdate: match.birthdate,
        bio: match.bio,
        avatar_url: match.avatar_url,
        preferences: match.preferences,
        location_lat: undefined,
        location_lng: undefined,
        last_active: new Date().toISOString(),
        is_verified: true,
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })) || [];
  return filteredMatches;
}

export async function likeUser(toUserId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  // Check if like already exists to prevent duplicates
  const { data: existingLikeCheck, error: checkExistingError } = await supabase
    .from("likes")
    .select("*")
    .eq("from_user_id", user.id)
    .eq("to_user_id", toUserId)
    .single();

  if (checkExistingError && checkExistingError.code !== "PGRST116") {
    console.error("Error checking existing like:", checkExistingError);
    throw new Error("Failed to check existing like");
  }

  if (existingLikeCheck) {
    // Like already exists, just return success
    return { success: true, isMatch: false };
  }

  // Create the like
  const { error: likeError } = await supabase.from("likes").insert({
    from_user_id: user.id,
    to_user_id: toUserId,
  });

  if (likeError) {
    console.error("Error creating like:", likeError);
    throw new Error(`Failed to create like: ${likeError.message}`);
  }

  // Check if the other user has already liked this user (mutual like = match)
  const { data: existingLike, error: checkError } = await supabase
    .from("likes")
    .select("*")
    .eq("from_user_id", toUserId)
    .eq("to_user_id", user.id)
    .single();

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking for match:", checkError);
    throw new Error("Failed to check for match");
  }

  if (existingLike) {
    // Create a match record
    const { error: matchError } = await supabase.from("matches").insert({
      user1_id: user.id,
      user2_id: toUserId,
      is_active: true,
    });

    if (matchError) {
      console.error("Error creating match:", matchError);
      // Don't throw error here, just log it as the like was successful
    }

    // Get the matched user's profile
    const { data: matchedUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", toUserId)
      .single();

    if (userError) {
      console.error("Error fetching matched user:", userError);
      throw new Error("Failed to fetch matched user");
    }

    return {
      success: true,
      isMatch: true,
      matchedUser: {
        id: matchedUser.id,
        full_name: matchedUser.full_name,
        username: matchedUser.username,
        email: matchedUser.email || "",
        gender: matchedUser.gender,
        birthdate: matchedUser.birthdate,
        bio: matchedUser.bio,
        avatar_url: matchedUser.avatar_url,
        preferences: matchedUser.preferences,
        location_lat: undefined,
        location_lng: undefined,
        last_active: new Date().toISOString(),
        is_verified: true,
        is_online: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as UserProfile,
    };
  }

  return { success: true, isMatch: false };
}

export async function getUserMatches() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated.");
  }

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
    .eq("is_active", true);

  if (error) {
    throw new Error("Failed to fetch matches");
  }

  const matchedUsers: UserProfile[] = [];

  for (const match of matches || []) {
    const otherUserId =
      match.user1_id === user.id ? match.user2_id : match.user1_id;

    const { data: otherUser, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", otherUserId)
      .single();

    if (userError) {
      continue;
    }

    matchedUsers.push({
      id: otherUser.id,
      full_name: otherUser.full_name,
      username: otherUser.username,
      email: otherUser.email,
      gender: otherUser.gender,
      birthdate: otherUser.birthdate,
      bio: otherUser.bio,
      avatar_url: otherUser.avatar_url,
      preferences: otherUser.preferences,
      location_lat: undefined,
      location_lng: undefined,
      last_active: new Date().toISOString(),
      is_verified: true,
      is_online: false,
      created_at: match.created_at,
      updated_at: match.created_at,
    });
  }

  return matchedUsers;
}
