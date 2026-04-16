"""
Standalone email service test script
Tests SMTP configuration and sends a test email
"""

import sys
import os
from pathlib import Path

# Add the parent directory to the path to import app modules
sys.path.insert(0, str(Path(__file__).parent))

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

from app.config import settings
from app.services.email_service import EmailService, validate_email_format


def test_email_configuration():
    """Test and display current SMTP configuration."""
    print("\n" + "="*60)
    print("📧 EMAIL SERVICE CONFIGURATION TEST")
    print("="*60)
    
    print(f"\n✓ Email Provider: {settings.EMAIL_PROVIDER}")
    print(f"✓ SMTP Host: {settings.SMTP_HOST}")
    print(f"✓ SMTP Port: {settings.SMTP_PORT}")
    print(f"✓ From Email: {settings.FROM_EMAIL}")
    print(f"✓ From Name: {settings.FROM_NAME}")
    
    if settings.SMTP_USER:
        print(f"✓ SMTP User: {settings.SMTP_USER}")
    else:
        print("✗ SMTP User: NOT CONFIGURED")
        return False
        
    if settings.SMTP_PASS:
        print(f"✓ SMTP Password: {'*' * len(settings.SMTP_PASS)}")
    else:
        print("✗ SMTP Password: NOT CONFIGURED")
        return False
    
    return True


def test_email_validation():
    """Test email validation function."""
    print("\n" + "="*60)
    print("✉️  EMAIL VALIDATION TEST")
    print("="*60)
    
    test_emails = [
        ("valid@example.com", True),
        ("test.user+tag@domain.co.uk", True),
        ("invalid..email@test.com", False),
        ("notanemail", False),
        ("user@", False),
    ]
    
    for email, expected in test_emails:
        result = validate_email_format(email)
        status = "✓" if result == expected else "✗"
        print(f"{status} {email}: {result}")


def test_send_email(recipient_email: str):
    """Test sending an actual email via SMTP."""
    print("\n" + "="*60)
    print("📤 SENDING TEST EMAIL")
    print("="*60)
    
    service = EmailService()
    
    subject = "MailEngine Test Email"
    html_body = """
    <html>
        <body style="font-family: Arial, sans-serif;">
            <h2>MailEngine Email Service Test</h2>
            <p>This is a test email from the MailEngine backend.</p>
            <p><strong>Test Status:</strong> Success ✓</p>
            <p>If you received this email, the SMTP configuration is working correctly!</p>
            <hr>
            <small>Generated at: """ + str(__import__('datetime').datetime.now()) + """</small>
        </body>
    </html>
    """
    
    print(f"\n📧 Recipient: {recipient_email}")
    print(f"📝 Subject: {subject}")
    print("\n⏳ Sending email...")
    
    try:
        success = service.send_via_smtp(
            to_email=recipient_email,
            subject=subject,
            html_body=html_body,
        )
        
        if success:
            print("✅ Email sent successfully!")
            print("\nEmail Details:")
            print(f"  - From: {settings.FROM_EMAIL}")
            print(f"  - To: {recipient_email}")
            print(f"  - Subject: {subject}")
            return True
        else:
            print("❌ Email send failed. Check logs for details.")
            return False
            
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all email service tests."""
    print("\n")
    print("🚀 " + "="*56 + " 🚀")
    print("   MAILENGINE EMAIL SERVICE TEST SUITE")
    print("🚀 " + "="*56 + " 🚀")
    
    # Test configuration
    config_ok = test_email_configuration()
    
    if not config_ok:
        print("\n❌ Configuration incomplete. Cannot proceed with email tests.")
        print("\nPlease configure SMTP_USER and SMTP_PASS in your .env file")
        return
    
    # Test email validation
    test_email_validation()
    
    # Ask for test email recipient
    print("\n" + "="*60)
    recipient = input("\n📬 Enter recipient email for test (or press Enter to skip): ").strip()
    
    if recipient:
        if validate_email_format(recipient):
            test_send_email(recipient)
        else:
            print(f"❌ Invalid email format: {recipient}")
    else:
        print("⏭️  Skipping email send test")
    
    print("\n" + "="*60)
    print("✅ TEST SUITE COMPLETE")
    print("="*60 + "\n")


if __name__ == "__main__":
    main()
