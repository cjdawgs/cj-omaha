import os
import sys
import time
import requests

# ==========================================
# CONFIGURATION & SETTINGS
# ==========================================
PROJECT_NAME = "cj-omaha-db"
DB_PASSWORD = "CJOmahaPass2026!" # Replace with a strong secure password
REGION_SUPABASE = "us-east-1"      # e.g., us-east-1, us-west-1, eu-central-1
REGION_NEON = "aws-us-east-1"      # e.g., aws-us-east-1, aws-us-east-2, aws-eu-central-1

def print_header(title):
    print("\n" + "=" * 60)
    print(f" 🚀 {title}")
    print("=" * 60)

# ==========================================
# 1. NEON DATABASE PROVISIONING
# ==========================================
def create_neon_project(neon_api_key):
    print_header("PROVISIONING NEON FREE POSTGRES DATABASE")
    
    headers = {
        "Authorization": f"Bearer {neon_api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    payload = {
        "project": {
            "name": PROJECT_NAME,
            "region_id": REGION_NEON,
            "pg_version": 16
        }
    }

    print(f"Creating Neon project '{PROJECT_NAME}' in region {REGION_NEON}...")
    url = "https://console.neon.tech/api/v2/projects"
    
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code not in [200, 201]:
        print(f"❌ Failed to create Neon project. Status Code: {response.status_code}")
        print(f"Error Details: {response.text}")
        return None

    data = response.json()
    project_id = data["project"]["id"]
    connection_uri = data.get("connection_uris", [{}])[0].get("connection_uri", "N/A")

    print("✅ Neon Project Created Successfully!")
    print(f"  - Project ID: {project_id}")
    print(f"  - Connection String: {connection_uri}")
    return data

# ==========================================
# 2. SUPABASE DATABASE PROVISIONING
# ==========================================
def get_supabase_organization(headers):
    """Fetch the default organization ID associated with your GitHub/Supabase account."""
    res = requests.get("https://api.supabase.com/v1/organizations", headers=headers)
    if res.status_code == 200:
        orgs = res.json()
        if orgs:
            return orgs[0]["id"]
    print("❌ Could not retrieve Supabase Organizations. Check your token.")
    sys.exit(1)

def create_supabase_project(supabase_token):
    print_header("PROVISIONING SUPABASE FREE POSTGRES DATABASE")

    headers = {
        "Authorization": f"Bearer {supabase_token}",
        "Content-Type": "application/json"
    }

    org_id = get_supabase_organization(headers)
    print(f"Using Supabase Org ID: {org_id}")

    payload = {
        "name": PROJECT_NAME,
        "organization_id": org_id,
        "region": REGION_SUPABASE,
        "db_pass": DB_PASSWORD,
        "plan": "free"
    }

    print(f"Creating Supabase project '{PROJECT_NAME}' in region {REGION_SUPABASE}...")
    url = "https://api.supabase.com/v1/projects"
    
    response = requests.post(url, headers=headers, json=payload)

    if response.status_code not in [200, 201]:
        print(f"❌ Failed to create Supabase project. Status Code: {response.status_code}")
        print(f"Error Details: {response.text}")
        return None

    data = response.json()
    project_id = data["id"]
    db_host = f"db.{project_id}.supabase.co"
    connection_string = f"postgresql://postgres:{DB_PASSWORD}@{db_host}:5432/postgres"

    print("✅ Supabase Project Provisioning Initiated!")
    print(f"  - Project Ref ID: {project_id}")
    print(f"  - Database Host: {db_host}")
    print(f"  - Connection String: {connection_string}")
    print("  - Status: Initializing (takes ~1-2 mins to be fully ready)")
    return data

# ==========================================
# MAIN EXECUTION FLOW
# ==========================================
def main():
    print_header("CJ OMAHA AUTOMATED DATABASE BUILDER")
    print("This script provisions free PostgreSQL instances on both Neon & Supabase.")

    # Get API Keys from Environment Variables or Prompt User
    neon_key = os.getenv("NEON_API_KEY")
    if not neon_key:
        neon_key = input("\n🔑 Enter your Neon API Key (from console.neon.tech): ").strip()

    supabase_token = os.getenv("SUPABASE_ACCESS_TOKEN")
    if not supabase_token:
        supabase_token = input("🔑 Enter your Supabase Access Token (from supabase.com/dashboard/account/tokens): ").strip()

    if not neon_key or not supabase_token:
        print("\n❌ Both Neon and Supabase keys are required to proceed.")
        sys.exit(1)

    # Execute Provisioning
    neon_res = create_neon_project(neon_key)
    supabase_res = create_supabase_project(supabase_token)

    print_header("SUMMARY & NEXT STEPS")
    if neon_res and supabase_res:
        print("🎉 Both PostgreSQL databases created successfully!")
        print("\nSave these connection strings in your Next.js `.env.local` file:")
        print(f"NEON_DATABASE_URL=\"{neon_res.get('connection_uris', [{}])[0].get('connection_uri')}\"")
        print(f"SUPABASE_DATABASE_URL=\"postgresql://postgres:{DB_PASSWORD}@db.{supabase_res['id']}.supabase.co:5432/postgres\"")
    else:
        print("⚠️ One or more provisioning steps failed. Check output errors above.")

if __name__ == "__main__":
    main()