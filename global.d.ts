// Workspace-wide ambient declarations to help the TypeScript server in a mixed JS/TS repo.

declare namespace Deno {
  const env: {
    get(key: string): string | undefined
  }
}

// Wildcard module declarations for deno.land std library imports
declare module "https://deno.land/std@*/*" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void
  export * from "https://deno.land/std@0.168.0/http/server.ts"
}

declare module "https://deno.land/std/*" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void
}

// Wildcard for esm.sh imports (including supabase)
declare module "https://esm.sh/*" {
  const whatever: any
  export default whatever
  export function createClient(...args: any[]): any
}

declare module "https://esm.sh/@supabase/supabase-js@*" {
  export function createClient(url: string, key: string, options?: any): any
}

// Fallback for other remote modules used in this workspace
// (removed generic https://* fallback to avoid masking more-specific declarations like deno.land/std)
