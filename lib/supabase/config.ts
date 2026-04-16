function getRequiredEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY") {
  const value = process.env[name];

  if (!value) {
    throw new Error(`La variable d'environnement ${name} est manquante.`);
  }

  return value;
}

export function getSupabaseUrl() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabasePublishableKey() {
  return getRequiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
}
