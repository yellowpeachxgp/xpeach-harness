import { executeOperation, resolveConfig } from "./runtime.js";
import { OPERATIONS } from "./operations.js";
const OP_OIDC_JWKS = OPERATIONS["oidc_jwks"];
const OP_OIDC_DISCOVERY = OPERATIONS["oidc_discovery"];
const OP_LEGACY_SELF_SOCIAL_LINK_ENTRY = OPERATIONS["legacy_self_social_link_entry"];
const OP_APPLICATION_CREATE = OPERATIONS["application_create"];
const OP_APPLICATION_DETAIL = OPERATIONS["application_detail"];
const OP_APPLICATION_UPDATE = OPERATIONS["application_update"];
const OP_APPLICATION_DELETE = OPERATIONS["application_delete"];
const OP_APPLICATION_REVOKE = OPERATIONS["application_revoke"];
const OP_APPLICATION_ROTATE = OPERATIONS["application_rotate"];
const OP_ADMIN_AUDIT_LOG_LIST = OPERATIONS["admin_audit_log_list"];
const OP_CDK_CLOSURE_EFFECTS = OPERATIONS["cdk_closure_effects"];
const OP_CDK_CLOSURE_RECOVER = OPERATIONS["cdk_closure_recover"];
const OP_CDK_CLOSURE_APPROVE = OPERATIONS["cdk_closure_approve"];
const OP_CDK_CLOSURE_REQUEST_EFFECT = OPERATIONS["cdk_closure_request_effect"];
const OP_CDK_CLOSURE_MYSQL_GET = OPERATIONS["cdk_closure_mysql_get"];
const OP_CDK_CLOSURE_MYSQL_CONFIGURE = OPERATIONS["cdk_closure_mysql_configure"];
const OP_CDK_MANAGEMENT_LIST = OPERATIONS["cdk_management_list"];
const OP_CDK_MANAGEMENT_CREATE = OPERATIONS["cdk_management_create"];
const OP_CDK_MANAGEMENT_DETAIL = OPERATIONS["cdk_management_detail"];
const OP_CDK_MANAGEMENT_ARCHIVE = OPERATIONS["cdk_management_archive"];
const OP_CDK_MANAGEMENT_STATUS = OPERATIONS["cdk_management_status"];
const OP_CDK_MANAGEMENT_EXPORT = OPERATIONS["cdk_management_export"];
const OP_CDK_MANAGEMENT_SYNC_STATUS = OPERATIONS["cdk_management_sync_status"];
const OP_CDK_MANAGEMENT_SYNC = OPERATIONS["cdk_management_sync"];
const OP_CDK_SYNC_SOURCE_HISTORY = OPERATIONS["cdk_sync_source_history"];
const OP_CDK_SYNC_COMMAND = OPERATIONS["cdk_sync_command"];
const OP_ADMIN_CDK_CODE_LIST = OPERATIONS["admin_cdk_code_list"];
const OP_ADMIN_CDK_CODE_STATUS = OPERATIONS["admin_cdk_code_status"];
const OP_ADMIN_REDEMPTION_LIST = OPERATIONS["admin_redemption_list"];
const OP_CENTER_INVITATIONS_LIST = OPERATIONS["center_invitations_list"];
const OP_CENTER_INVITATIONS_CREATE = OPERATIONS["center_invitations_create"];
const OP_CENTER_INVITATION_REVOKE = OPERATIONS["center_invitation_revoke"];
const OP_CENTER_MEMBERS_LIST = OPERATIONS["center_members_list"];
const OP_CENTER_MEMBERS_ADD = OPERATIONS["center_members_add"];
const OP_CENTER_MEMBERS_CREATE = OPERATIONS["center_members_create"];
const OP_CENTER_MEMBER_REMOVE = OPERATIONS["center_member_remove"];
const OP_CENTER_MEMBER_ROLE_CHANGE = OPERATIONS["center_member_role_change"];
const OP_ADMIN_CLIENT_LIST = OPERATIONS["admin_client_list"];
const OP_ADMIN_CLIENT_DETAIL = OPERATIONS["admin_client_detail"];
const OP_ADMIN_CLIENT_DISABLED = OPERATIONS["admin_client_disabled"];
const OP_CLOUD_PROJECTION_EXPORT = OPERATIONS["cloud_projection_export"];
const OP_CLOUD_PROJECTION_HISTORY = OPERATIONS["cloud_projection_history"];
const OP_CLOUD_PROJECTION_RUNS_LIST = OPERATIONS["cloud_projection_runs_list"];
const OP_CLOUD_PROJECTION_RUN = OPERATIONS["cloud_projection_run"];
const OP_CENTER_FINANCE_IMPORT_CREATE = OPERATIONS["center_finance_import_create"];
const OP_CENTER_FINANCE_IMPORT_INSPECT = OPERATIONS["center_finance_import_inspect"];
const OP_CENTER_FINANCE_OBSERVATIONS = OPERATIONS["center_finance_observations"];
const OP_CENTER_FINANCE_SYNC_LIST = OPERATIONS["center_finance_sync_list"];
const OP_CENTER_FINANCE_SYNC_CREATE = OPERATIONS["center_finance_sync_create"];
const OP_CENTER_FINANCE_SYNC_DETAIL = OPERATIONS["center_finance_sync_detail"];
const OP_CENTER_FINANCE_SYNC_CANCEL = OPERATIONS["center_finance_sync_cancel"];
const OP_CENTER_FINANCE_SYNC_FACTS = OPERATIONS["center_finance_sync_facts"];
const OP_CENTER_FINANCE_SYNC_RETRY = OPERATIONS["center_finance_sync_retry"];
const OP_ADMIN_FINANCE_AUDIT = OPERATIONS["admin_finance_audit"];
const OP_ADMIN_FINANCE_AUDIT_EVENTS = OPERATIONS["admin_finance_audit_events"];
const OP_ADMIN_CARD_EVENT_LIST = OPERATIONS["admin_card_event_list"];
const OP_ADMIN_CASH_ENTRY_LIST = OPERATIONS["admin_cash_entry_list"];
const OP_ADMIN_COMPANY_CARD_WEEKS = OPERATIONS["admin_company_card_weeks"];
const OP_ADMIN_FUND_POOL_LIST = OPERATIONS["admin_fund_pool_list"];
const OP_ADMIN_FX_SNAPSHOT_LIST = OPERATIONS["admin_fx_snapshot_list"];
const OP_FINANCE_INTEGRITY_MACHINE_BINDING = OPERATIONS["finance_integrity_machine_binding"];
const OP_FINANCE_INTEGRITY_REFRESH_BINDING = OPERATIONS["finance_integrity_refresh_binding"];
const OP_FINANCE_INTEGRITY_SNAPSHOT = OPERATIONS["finance_integrity_snapshot"];
const OP_FINANCE_MANAGEMENT_OVERVIEW = OPERATIONS["finance_management_overview"];
const OP_FINANCE_MANAGEMENT_LOOKUP = OPERATIONS["finance_management_lookup"];
const OP_FINANCE_MANAGEMENT_COMMAND = OPERATIONS["finance_management_command"];
const OP_ADMIN_FINANCE_OVERVIEW = OPERATIONS["admin_finance_overview"];
const OP_FINANCE_PROJECTION_LIST = OPERATIONS["finance_projection_list"];
const OP_FINANCE_PROJECTION_START = OPERATIONS["finance_projection_start"];
const OP_FINANCE_PROJECTION_EXPORT = OPERATIONS["finance_projection_export"];
const OP_FINANCE_PROJECTION_SOURCE_LOOKUP = OPERATIONS["finance_projection_source_lookup"];
const OP_FINANCE_PROJECTION_DETAIL = OPERATIONS["finance_projection_detail"];
const OP_FINANCE_HISTORY_COMPLETION_DETAIL = OPERATIONS["finance_history_completion_detail"];
const OP_FINANCE_HISTORY_COMPLETION_START = OPERATIONS["finance_history_completion_start"];
const OP_FINANCE_HISTORY_COMPLETION_RECORDS = OPERATIONS["finance_history_completion_records"];
const OP_FINANCE_INTEGRITY_PRIVATE_FIELDS = OPERATIONS["finance_integrity_private_fields"];
const OP_FINANCE_PROJECTION_RECORDS = OPERATIONS["finance_projection_records"];
const OP_FINANCE_PROJECTION_COMMAND = OPERATIONS["finance_projection_command"];
const OP_ADMIN_FINANCE_RECEIPTS = OPERATIONS["admin_finance_receipts"];
const OP_ADMIN_RESOLUTION_ERROR_LIST = OPERATIONS["admin_resolution_error_list"];
const OP_ADMIN_FINANCE_ROSTER = OPERATIONS["admin_finance_roster"];
const OP_ADMIN_FINANCE_ROSTER_ACTIVE = OPERATIONS["admin_finance_roster_active"];
const OP_ADMIN_SHEET_NOTE_LIST = OPERATIONS["admin_sheet_note_list"];
const OP_ADMIN_SHEET_NOTE_PUT = OPERATIONS["admin_sheet_note_put"];
const OP_ADMIN_FINANCE_PAY = OPERATIONS["admin_finance_pay"];
const OP_ADMIN_SOURCE_STATE_LIST = OPERATIONS["admin_source_state_list"];
const OP_ADMIN_SUBMISSION_LIST = OPERATIONS["admin_submission_list"];
const OP_ADMIN_FINANCE_APPROVE = OPERATIONS["admin_finance_approve"];
const OP_ADMIN_FINANCE_REJECT = OPERATIONS["admin_finance_reject"];
const OP_ADMIN_TRANSFER_LIST = OPERATIONS["admin_transfer_list"];
const OP_ADMIN_WEEKLY_SHEET_LIST = OPERATIONS["admin_weekly_sheet_list"];
const OP_ADMIN_WEEKLY_SHEET_ACTION = OPERATIONS["admin_weekly_sheet_action"];
const OP_ADMIN_FINANCE_CLOSE_WEEK = OPERATIONS["admin_finance_close_week"];
const OP_ADMIN_FINANCE_CORRECT_WEEK = OPERATIONS["admin_finance_correct_week"];
const OP_ADMIN_FINANCE_REOPEN_WEEK = OPERATIONS["admin_finance_reopen_week"];
const OP_CENTER_ROLE_DEFAULTS_GET = OPERATIONS["center_role_defaults_get"];
const OP_CENTER_ROLE_DEFAULT_WRITE = OPERATIONS["center_role_default_write"];
const OP_CENTER_USER_ROLE_BUNDLE = OPERATIONS["center_user_role_bundle"];
const OP_CENTER_MAIL_LOGS = OPERATIONS["center_mail_logs"];
const OP_CENTER_MAIL_PREVIEW = OPERATIONS["center_mail_preview"];
const OP_CENTER_MAIL_TEMPLATES_LIST = OPERATIONS["center_mail_templates_list"];
const OP_CENTER_MAIL_TEMPLATE_PUT = OPERATIONS["center_mail_template_put"];
const OP_CENTER_MAIL_TEST = OPERATIONS["center_mail_test"];
const OP_LEGACY_NAVIGATION_RESOLVE = OPERATIONS["legacy_navigation_resolve"];
const OP_OAUTH_CONNECTIONS_PROVIDERS = OPERATIONS["oauth_connections_providers"];
const OP_OAUTH_CONNECTIONS_SEARCH = OPERATIONS["oauth_connections_search"];
const OP_OAUTH_INTEGRATION_GET = OPERATIONS["oauth_integration_get"];
const OP_ADMIN_ORDER_LIST = OPERATIONS["admin_order_list"];
const OP_OUTBOUND_WEBHOOKS_LIST = OPERATIONS["outbound_webhooks_list"];
const OP_OUTBOUND_WEBHOOK_CREATE = OPERATIONS["outbound_webhook_create"];
const OP_OUTBOUND_WEBHOOK_UPDATE = OPERATIONS["outbound_webhook_update"];
const OP_OUTBOUND_WEBHOOK_DELETE = OPERATIONS["outbound_webhook_delete"];
const OP_OUTBOUND_WEBHOOK_DELIVERIES = OPERATIONS["outbound_webhook_deliveries"];
const OP_OUTBOUND_WEBHOOK_PING = OPERATIONS["outbound_webhook_ping"];
const OP_OUTBOUND_WEBHOOK_RETRY = OPERATIONS["outbound_webhook_retry"];
const OP_ADMIN_RECONCILE_REQUEST = OPERATIONS["admin_reconcile_request"];
const OP_PERMISSION_MATRIX_READ = OPERATIONS["permission_matrix_read"];
const OP_PERMISSION_DISPATCH_LIST = OPERATIONS["permission_dispatch_list"];
const OP_PERMISSION_DISPATCH_RETRY = OPERATIONS["permission_dispatch_retry"];
const OP_PERMISSION_GROUP_WRITE = OPERATIONS["permission_group_write"];
const OP_PERMISSION_TARGET_WRITE = OPERATIONS["permission_target_write"];
const OP_PERMISSION_BATCH_ASSIGN = OPERATIONS["permission_batch_assign"];
const OP_PERMISSION_BATCH_RECONCILE = OPERATIONS["permission_batch_reconcile"];
const OP_PERMISSION_TARGETS_RESOLVE = OPERATIONS["permission_targets_resolve"];
const OP_ADMIN_PLATFORM_ADMIN_LIST = OPERATIONS["admin_platform_admin_list"];
const OP_ADMIN_PLATFORM_ADMIN_GRANT = OPERATIONS["admin_platform_admin_grant"];
const OP_ADMIN_PLATFORM_ADMIN_REVOKE = OPERATIONS["admin_platform_admin_revoke"];
const OP_ADMIN_RUNTIME_MIGRATIONS = OPERATIONS["admin_runtime_migrations"];
const OP_ADMIN_RUNTIME_MIGRATE_RECONCILE = OPERATIONS["admin_runtime_migrate_reconcile"];
const OP_ADMIN_RUNTIME_RELEASE_STATE = OPERATIONS["admin_runtime_release_state"];
const OP_ADMIN_RUNTIME_RETIRE_PROBE = OPERATIONS["admin_runtime_retire_probe"];
const OP_SECURITY_AUDIT_LIST = OPERATIONS["security_audit_list"];
const OP_SECURITY_AUDIT_EXPORT = OPERATIONS["security_audit_export"];
const OP_SECURITY_AUDIT_OVERVIEW = OPERATIONS["security_audit_overview"];
const OP_ADMIN_SESSION_LIST = OPERATIONS["admin_session_list"];
const OP_ADMIN_SESSION_REVOKE = OPERATIONS["admin_session_revoke"];
const OP_ADMIN_SERVICE_KEY_PERMISSIONS = OPERATIONS["admin_service_key_permissions"];
const OP_ADMIN_SERVICE_KEY_LIST = OPERATIONS["admin_service_key_list"];
const OP_ADMIN_SERVICE_KEY_CREATE = OPERATIONS["admin_service_key_create"];
const OP_ADMIN_SERVICE_KEY_DISABLED = OPERATIONS["admin_service_key_disabled"];
const OP_CENTER_BILLING_SETTINGS_GET = OPERATIONS["center_billing_settings_get"];
const OP_CENTER_BILLING_SETTINGS_SAVE = OPERATIONS["center_billing_settings_save"];
const OP_CENTER_BILLING_PROVIDER_PROBE = OPERATIONS["center_billing_provider_probe"];
const OP_CENTER_BILLING_FEE_SIMULATION = OPERATIONS["center_billing_fee_simulation"];
const OP_CENTER_BILLING_SYNC = OPERATIONS["center_billing_sync"];
const OP_CENTER_CAPTCHA_GET = OPERATIONS["center_captcha_get"];
const OP_CENTER_CAPTCHA_PUT = OPERATIONS["center_captcha_put"];
const OP_CLOUD_PROJECTION_SETTINGS_GET = OPERATIONS["cloud_projection_settings_get"];
const OP_CLOUD_PROJECTION_SETTINGS_PUT = OPERATIONS["cloud_projection_settings_put"];
const OP_CENTER_GENERAL_GET = OPERATIONS["center_general_get"];
const OP_CENTER_GENERAL_PUT = OPERATIONS["center_general_put"];
const OP_CENTER_INTERFACES_LIST = OPERATIONS["center_interfaces_list"];
const OP_CENTER_INTERFACE_UPDATE = OPERATIONS["center_interface_update"];
const OP_CENTER_MAIL_GET = OPERATIONS["center_mail_get"];
const OP_CENTER_MAIL_PUT = OPERATIONS["center_mail_put"];
const OP_CENTER_OAUTH_LIST = OPERATIONS["center_oauth_list"];
const OP_CENTER_OAUTH_DISCOVERY = OPERATIONS["center_oauth_discovery"];
const OP_CENTER_OAUTH_PUT = OPERATIONS["center_oauth_put"];
const OP_CENTER_SECURITY_GET = OPERATIONS["center_security_get"];
const OP_CENTER_SECURITY_PUT = OPERATIONS["center_security_put"];
const OP_SITE_OBSERVATION_ANALYSIS = OPERATIONS["site_observation_analysis"];
const OP_SITE_OBSERVATION_EXPORT = OPERATIONS["site_observation_export"];
const OP_SITE_OBSERVATION_TARGETS = OPERATIONS["site_observation_targets"];
const OP_SITE_OBSERVATION_APPROVE = OPERATIONS["site_observation_approve"];
const OP_SITE_OBSERVATION_RUNS = OPERATIONS["site_observation_runs"];
const OP_SITE_OBSERVATION_START = OPERATIONS["site_observation_start"];
const OP_SITE_OBSERVATION_SCHEDULE_GET = OPERATIONS["site_observation_schedule_get"];
const OP_SITE_OBSERVATION_SCHEDULE_PUT = OPERATIONS["site_observation_schedule_put"];
const OP_ADMIN_SITE_LIST = OPERATIONS["admin_site_list"];
const OP_ADMIN_SITE_MODULE_MODE = OPERATIONS["admin_site_module_mode"];
const OP_ACCOUNT_STATUS_SYNC_GET = OPERATIONS["account_status_sync_get"];
const OP_ACCOUNT_STATUS_SYNC_CHANGE = OPERATIONS["account_status_sync_change"];
const OP_CENTER_SYSTEM_MAINTENANCE_PREVIEW = OPERATIONS["center_system_maintenance_preview"];
const OP_CENTER_SYSTEM_MAINTENANCE_RUN = OPERATIONS["center_system_maintenance_run"];
const OP_CENTER_SYSTEM_OVERVIEW = OPERATIONS["center_system_overview"];
const OP_ADMIN_TENANT_LIST = OPERATIONS["admin_tenant_list"];
const OP_ADMIN_TENANT_DETAIL = OPERATIONS["admin_tenant_detail"];
const OP_ADMIN_TENANT_STATUS = OPERATIONS["admin_tenant_status"];
const OP_TRANSLATION_CREATE = OPERATIONS["translation_create"];
const OP_TRANSLATION_CAPABILITIES = OPERATIONS["translation_capabilities"];
const OP_TRANSLATION_GET = OPERATIONS["translation_get"];
const OP_TRANSLATION_CANCEL = OPERATIONS["translation_cancel"];
const OP_ADMIN_USER_LIST = OPERATIONS["admin_user_list"];
const OP_USER_DIRECTORY_CREATE = OPERATIONS["user_directory_create"];
const OP_USER_DIRECTORY_EXPORT = OPERATIONS["user_directory_export"];
const OP_ADMIN_USER_DETAIL = OPERATIONS["admin_user_detail"];
const OP_USER_DIRECTORY_GET = OPERATIONS["user_directory_get"];
const OP_USER_DIRECTORY_UPDATE = OPERATIONS["user_directory_update"];
const OP_USER_DIRECTORY_ACTION = OPERATIONS["user_directory_action"];
const OP_ADMIN_INVITE_REBIND = OPERATIONS["admin_invite_rebind"];
const OP_ADMIN_INVITE_HISTORY = OPERATIONS["admin_invite_history"];
const OP_MFA_RECOVERY_LIST = OPERATIONS["mfa_recovery_list"];
const OP_MFA_RECOVERY_REQUEST = OPERATIONS["mfa_recovery_request"];
const OP_MFA_RECOVERY_APPROVE = OPERATIONS["mfa_recovery_approve"];
const OP_ADMIN_USER_STATUS = OPERATIONS["admin_user_status"];
const OP_ADMIN_USER_UNLOCK = OPERATIONS["admin_user_unlock"];
const OP_ADMIN_WALLET_ADJUST = OPERATIONS["admin_wallet_adjust"];
const OP_ADMIN_RESERVATION_LIST = OPERATIONS["admin_reservation_list"];
const OP_PUBLIC_ABOUT_GET = OPERATIONS["public_about_get"];
const OP_LEGACY_BUSINESS_BILLING_SUMMARY_BLOCKED = OPERATIONS["legacy_business_billing_summary_blocked"];
const OP_LEGACY_BUSINESS_FINANCE_EVENTS_INTERNAL = OPERATIONS["legacy_business_finance_events_internal"];
const OP_LEGACY_BUSINESS_FINANCE_MATRIX_INTERNAL_BLOCKED = OPERATIONS["legacy_business_finance_matrix_internal_blocked"];
const OP_LEGACY_BUSINESS_RECHARGE_BLOCKED_INTERNAL = OPERATIONS["legacy_business_recharge_blocked_internal"];
const OP_V1_INTERNAL_NATIVE_AUTH = OPERATIONS["v1_internal_native_auth"];
const OP_LEGACY_BUSINESS_PROFILE_GET = OPERATIONS["legacy_business_profile_get"];
const OP_LEGACY_BUSINESS_PROFILE_WRITE = OPERATIONS["legacy_business_profile_write"];
const OP_V1_INTERNAL_VERIFY = OPERATIONS["v1_internal_verify"];
const OP_PUBLIC_PRIVACY_POLICY_GET = OPERATIONS["public_privacy_policy_get"];
const OP_CENTER_PUBLIC_BRAND = OPERATIONS["center_public_brand"];
const OP_PUBLIC_USER_AGREEMENT_GET = OPERATIONS["public_user_agreement_get"];
const OP_CDK_CLOSURE_LEGACY_ACCOUNT_REDEEM = OPERATIONS["cdk_closure_legacy_account_redeem"];
const OP_V1_NATIVE_LOGIN = OPERATIONS["v1_native_login"];
const OP_CDK_CLOSURE_LEGACY_CLUSTER_REDEEM = OPERATIONS["cdk_closure_legacy_cluster_redeem"];
const OP_V1_DEVICE_AUTHORIZE = OPERATIONS["v1_device_authorize"];
const OP_V1_DEVICE_TOKEN = OPERATIONS["v1_device_token"];
const OP_LEGACY_BUSINESS_FINANCE_EVENTS_V1 = OPERATIONS["legacy_business_finance_events_v1"];
const OP_LEGACY_BUSINESS_FINANCE_MATRIX_V1_BLOCKED = OPERATIONS["legacy_business_finance_matrix_v1_blocked"];
const OP_LEGACY_BUSINESS_RECHARGE_BLOCKED_V1 = OPERATIONS["legacy_business_recharge_blocked_v1"];
const OP_V1_OPENAPI_JSON = OPERATIONS["v1_openapi_json"];
const OP_V1_PEACHCODE_CREDENTIALS = OPERATIONS["v1_peachcode_credentials"];
const OP_V1_PEACHCODE_REVOKE = OPERATIONS["v1_peachcode_revoke"];
const OP_LEGACY_BUSINESS_REFERRALS_BIND_BODY = OPERATIONS["legacy_business_referrals_bind_body"];
const OP_V1_REGISTER = OPERATIONS["v1_register"];
const OP_V1_REGISTER_CLAIM = OPERATIONS["v1_register_claim"];
const OP_V1_REGISTER_VERIFY = OPERATIONS["v1_register_verify"];
const OP_V1_SOCIAL_CALLBACK = OPERATIONS["v1_social_callback"];
const OP_V1_SOCIAL_START = OPERATIONS["v1_social_start"];
const OP_LEGACY_BUSINESS_AFF_CODE = OPERATIONS["legacy_business_aff_code"];
const OP_LEGACY_BUSINESS_PEACH_GET = OPERATIONS["legacy_business_peach_get"];
const OP_LEGACY_BUSINESS_PEACH_ADJUST_BLOCKED = OPERATIONS["legacy_business_peach_adjust_blocked"];
const OP_LEGACY_BUSINESS_PROVISION_BLOCKED = OPERATIONS["legacy_business_provision_blocked"];
const OP_LEGACY_BUSINESS_REFERRALS_GET = OPERATIONS["legacy_business_referrals_get"];
const OP_LEGACY_BUSINESS_REFERRALS_BIND_PATH = OPERATIONS["legacy_business_referrals_bind_path"];
const OP_LEGACY_BUSINESS_COST_BRIDGE_OPENCLAW = OPERATIONS["legacy_business_cost_bridge_openclaw"];
const OP_OIDC_AUTHORIZE = OPERATIONS["oidc_authorize"];
const OP_CAPTCHA_POLICY_GET = OPERATIONS["captcha_policy_get"];
const OP_CAPTCHA_VERIFY = OPERATIONS["captcha_verify"];
const OP_CDK_REDEEM = OPERATIONS["cdk_redeem"];
const OP_SITE_OBSERVATION_LEGACY_EXPORT = OPERATIONS["site_observation_legacy_export"];
const OP_LEGACY_CONSOLE_SOCIAL_START = OPERATIONS["legacy_console_social_start"];
const OP_OIDC_DEVICE_AUTHORIZATION = OPERATIONS["oidc_device_authorization"];
const OP_FINANCE_MANAGEMENT_SELF_SUBMIT = OPERATIONS["finance_management_self_submit"];
const OP_FINANCE_SUBMIT = OPERATIONS["finance_submit"];
const OP_FINANCE_WEEKLY_LIST = OPERATIONS["finance_weekly_list"];
const OP_HEALTH_CLIENT_IP = OPERATIONS["health_client_ip"];
const OP_HEALTH_LIVE = OPERATIONS["health_live"];
const OP_HEALTH_READY = OPERATIONS["health_ready"];
const OP_OP_HEALTHZ = OPERATIONS["op_healthz"];
const OP_LEGACY_BUSINESS_COST_BRIDGE_INTERNAL = OPERATIONS["legacy_business_cost_bridge_internal"];
const OP_MIGRATION_RECONCILE = OPERATIONS["migration_reconcile"];
const OP_MIGRATION_PREPARE = OPERATIONS["migration_prepare"];
const OP_RECOVERY_INSPECT = OPERATIONS["recovery_inspect"];
const OP_RECOVERY_RESTORE = OPERATIONS["recovery_restore"];
const OP_RELEASE_INSPECT = OPERATIONS["release_inspect"];
const OP_RELEASE_ACTIVATE = OPERATIONS["release_activate"];
const OP_RELEASE_DECIDE = OPERATIONS["release_decide"];
const OP_RELEASE_OPEN = OPERATIONS["release_open"];
const OP_RELEASE_PRE_SEAL = OPERATIONS["release_pre_seal"];
const OP_RETIRE_PROBE = OPERATIONS["retire_probe"];
const OP_WAL_CENTER_ACK = OPERATIONS["wal_center_ack"];
const OP_WAL_CENTER_REPORT = OPERATIONS["wal_center_report"];
const OP_OIDC_JWKS_ALIAS = OPERATIONS["oidc_jwks_alias"];
const OP_LEGACY_LANGUAGE_GET = OPERATIONS["legacy_language_get"];
const OP_LEGACY_LANGUAGE_POST = OPERATIONS["legacy_language_post"];
const OP_ME_GET = OPERATIONS["me_get"];
const OP_ME_CHANGE_PASSWORD = OPERATIONS["me_change_password"];
const OP_ME_RECOVERY_USE = OPERATIONS["me_recovery_use"];
const OP_METRICS_TEXT = OPERATIONS["metrics_text"];
const OP_ORDER_LIST = OPERATIONS["order_list"];
const OP_ORDER_CREATE = OPERATIONS["order_create"];
const OP_PAYMENT_ADOPT = OPERATIONS["payment_adopt"];
const OP_PAYMENT_RECONCILE = OPERATIONS["payment_reconcile"];
const OP_PORTAL_CAPTCHA_GET = OPERATIONS["portal_captcha_get"];
const OP_PORTAL_AUTH_CONTINUATION_PREPARE = OPERATIONS["portal_auth_continuation_prepare"];
const OP_PORTAL_AUTH_CONTINUATION_RESUME = OPERATIONS["portal_auth_continuation_resume"];
const OP_PORTAL_EMAIL_CLAIM = OPERATIONS["portal_email_claim"];
const OP_PORTAL_EMAIL_RESEND = OPERATIONS["portal_email_resend"];
const OP_PORTAL_EMAIL_VERIFY = OPERATIONS["portal_email_verify"];
const OP_PORTAL_LOGIN = OPERATIONS["portal_login"];
const OP_PORTAL_LOGIN_RECOVERY = OPERATIONS["portal_login_recovery"];
const OP_PORTAL_LOGIN_TOTP = OPERATIONS["portal_login_totp"];
const OP_PORTAL_LOGOUT = OPERATIONS["portal_logout"];
const OP_PASSKEY_AUTH_COMPLETE = OPERATIONS["passkey_auth_complete"];
const OP_PASSKEY_AUTH_OPTIONS = OPERATIONS["passkey_auth_options"];
const OP_PORTAL_PASSWORD_FORGOT = OPERATIONS["portal_password_forgot"];
const OP_PORTAL_PASSWORD_RESET = OPERATIONS["portal_password_reset"];
const OP_PORTAL_AUTH_PROVIDERS = OPERATIONS["portal_auth_providers"];
const OP_PORTAL_REGISTER = OPERATIONS["portal_register"];
const OP_PORTAL_SOCIAL_MFA_TICKET = OPERATIONS["portal_social_mfa_ticket"];
const OP_SOCIAL_START = OPERATIONS["social_start"];
const OP_SOCIAL_CALLBACK = OPERATIONS["social_callback"];
const OP_CDK_CLOSURE_DELEGATION = OPERATIONS["cdk_closure_delegation"];
const OP_CDK_CLOSURE_REDEEM = OPERATIONS["cdk_closure_redeem"];
const OP_CENTER_INVITATION_ACCEPT = OPERATIONS["center_invitation_accept"];
const OP_CENTER_INVITATION_INSPECT = OPERATIONS["center_invitation_inspect"];
const OP_PORTAL_DEVICE_INFO = OPERATIONS["portal_device_info"];
const OP_PORTAL_DEVICE_APPROVE = OPERATIONS["portal_device_approve"];
const OP_PORTAL_DEVICE_DENY = OPERATIONS["portal_device_deny"];
const OP_SELF_SECURITY_EMAIL_REQUEST = OPERATIONS["self_security_email_request"];
const OP_SELF_SECURITY_EMAIL_CONFIRM = OPERATIONS["self_security_email_confirm"];
const OP_SELF_SECURITY_EMAIL_UNBIND = OPERATIONS["self_security_email_unbind"];
const OP_CDK_CLOSURE_ENTITLEMENTS = OPERATIONS["cdk_closure_entitlements"];
const OP_SELF_SECURITY_IDENTITIES = OPERATIONS["self_security_identities"];
const OP_SELF_SECURITY_IDENTITY_UNLINK = OPERATIONS["self_security_identity_unlink"];
const OP_PORTAL_IDENTITY_LINK_START = OPERATIONS["portal_identity_link_start"];
const OP_CDK_CLOSURE_INVITATION = OPERATIONS["cdk_closure_invitation"];
const OP_CDK_CLOSURE_RENAME = OPERATIONS["cdk_closure_rename"];
const OP_PORTAL_ME = OPERATIONS["portal_me"];
const OP_PORTAL_ME_PATCH = OPERATIONS["portal_me_patch"];
const OP_PORTAL_RECOVERY_CODES_STATUS = OPERATIONS["portal_recovery_codes_status"];
const OP_PORTAL_RECOVERY_CODES_REGENERATE = OPERATIONS["portal_recovery_codes_regenerate"];
const OP_PORTAL_TOTP_CONFIRM = OPERATIONS["portal_totp_confirm"];
const OP_PORTAL_TOTP_DISABLE = OPERATIONS["portal_totp_disable"];
const OP_PORTAL_TOTP_SETUP = OPERATIONS["portal_totp_setup"];
const OP_PORTAL_NOTIFICATIONS = OPERATIONS["portal_notifications"];
const OP_PORTAL_NOTIFICATIONS_READ_ALL = OPERATIONS["portal_notifications_read_all"];
const OP_PORTAL_NOTIFICATION_READ = OPERATIONS["portal_notification_read"];
const OP_SELF_SECURITY_OIDC_SESSIONS = OPERATIONS["self_security_oidc_sessions"];
const OP_SELF_SECURITY_OIDC_REVOKE = OPERATIONS["self_security_oidc_revoke"];
const OP_PASSKEYS_LIST = OPERATIONS["passkeys_list"];
const OP_PASSKEYS_REGISTER_OPTIONS = OPERATIONS["passkeys_register_options"];
const OP_PASSKEYS_REGISTER = OPERATIONS["passkeys_register"];
const OP_PASSKEY_RENAME = OPERATIONS["passkey_rename"];
const OP_PASSKEY_DELETE = OPERATIONS["passkey_delete"];
const OP_SELF_SECURITY_SUMMARY = OPERATIONS["self_security_summary"];
const OP_PORTAL_SESSIONS = OPERATIONS["portal_sessions"];
const OP_PORTAL_SESSIONS_REVOKE_OTHERS = OPERATIONS["portal_sessions_revoke_others"];
const OP_PORTAL_SESSION_REVOKE = OPERATIONS["portal_session_revoke"];
const OP_PORTAL_SITES = OPERATIONS["portal_sites"];
const OP_PORTAL_SITE_SET_DEFAULT = OPERATIONS["portal_site_set_default"];
const OP_OP_READYZ = OPERATIONS["op_readyz"];
const OP_LEGACY_SOCIAL_START = OPERATIONS["legacy_social_start"];
const OP_LEGACY_SOCIAL_CALLBACK = OPERATIONS["legacy_social_callback"];
const OP_OIDC_TENANT_DISCOVERY = OPERATIONS["oidc_tenant_discovery"];
const OP_OIDC_TENANT_AUTHORIZE = OPERATIONS["oidc_tenant_authorize"];
const OP_OIDC_TENANT_DEVICE_AUTHORIZATION = OPERATIONS["oidc_tenant_device_authorization"];
const OP_OIDC_TENANT_JWKS = OPERATIONS["oidc_tenant_jwks"];
const OP_OIDC_TENANT_ME = OPERATIONS["oidc_tenant_me"];
const OP_OIDC_TENANT_ME_POST = OPERATIONS["oidc_tenant_me_post"];
const OP_OIDC_TENANT_TOKEN = OPERATIONS["oidc_tenant_token"];
const OP_OIDC_TENANT_TOKEN_REVOCATION = OPERATIONS["oidc_tenant_token_revocation"];
const OP_OIDC_TOKEN = OPERATIONS["oidc_token"];
const OP_OIDC_TOKEN_REVOCATION = OPERATIONS["oidc_token_revocation"];
const OP_WALLET_ADJUST = OPERATIONS["wallet_adjust"];
const OP_WALLET_BALANCE = OPERATIONS["wallet_balance"];
const OP_WALLET_CHARGEBACK_SUBMIT = OPERATIONS["wallet_chargeback_submit"];
const OP_WALLET_EXTEND = OPERATIONS["wallet_extend"];
const OP_WALLET_RECONCILIATION_DIFFERENCES = OPERATIONS["wallet_reconciliation_differences"];
const OP_WALLET_REFUND_SUBMIT = OPERATIONS["wallet_refund_submit"];
const OP_WALLET_RELEASE = OPERATIONS["wallet_release"];
const OP_WALLET_RESERVATION_LOOKUP = OPERATIONS["wallet_reservation_lookup"];
const OP_WALLET_RESERVE = OPERATIONS["wallet_reserve"];
const OP_WALLET_REVERSE_SUBMIT = OPERATIONS["wallet_reverse_submit"];
const OP_WALLET_SETTLE = OPERATIONS["wallet_settle"];
/** XPeach SSO v2 业务 API 强类型客户端（/api/v2/*）。 */
export class XpeachClient {
    cfg;
    constructor(config) {
        this.cfg = resolveConfig(config);
    }
    /** JWKS（根 issuer） */
    async oidcJwks(options) {
        const out = await executeOperation(this.cfg, OP_OIDC_JWKS, {}, options);
        return out;
    }
    /** OIDC discovery（根 issuer） */
    async oidcDiscovery(options) {
        const out = await executeOperation(this.cfg, OP_OIDC_DISCOVERY, {}, options);
        return out;
    }
    /** 旧社交入口导向同一受保护认证流程 */
    async legacySelfSocialLinkEntry(args, options) {
        await executeOperation(this.cfg, OP_LEGACY_SELF_SOCIAL_LINK_ENTRY, { pathParams: { "provider": args.provider } }, options);
        return;
    }
    /** 创建单中心接入应用 */
    async applicationCreate(args, options) {
        const out = await executeOperation(this.cfg, OP_APPLICATION_CREATE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 读取应用完整配置，排除共享机密 */
    async applicationDetail(args, options) {
        const out = await executeOperation(this.cfg, OP_APPLICATION_DETAIL, { pathParams: { "id": args.id } }, options);
        return out;
    }
    /** 版本 CAS 编辑应用 */
    async applicationUpdate(args, options) {
        const out = await executeOperation(this.cfg, OP_APPLICATION_UPDATE, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 删除应用并保留撤销证据 */
    async applicationDelete(args, options) {
        const out = await executeOperation(this.cfg, OP_APPLICATION_DELETE, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 撤销应用全部令牌 */
    async applicationRevoke(args, options) {
        const out = await executeOperation(this.cfg, OP_APPLICATION_REVOKE, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 轮换机密 */
    async applicationRotate(args, options) {
        const out = await executeOperation(this.cfg, OP_APPLICATION_ROTATE, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 审计日志 */
    async adminAuditLogList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_AUDIT_LOG_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "event": args?.event, "actor_user_id": args?.actorUserId, "query": args?.query, "target_table": args?.targetTable } }, options);
        return out;
    }
    /** 管理员读取最近一百条持久跨站效果；不包含秘密和原码 */
    async cdkClosureEffects(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_EFFECTS, { query: { "target": args?.target, "user_id": args?.userId } }, options);
        return out;
    }
    /** 未知写结果仅批准只读回读；不生成新写键 */
    async cdkClosureRecover(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_RECOVER, { pathParams: { "id": args.id }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 按能力批准当前来源、凭据及连接器版本；不继承只读观测批准 */
    async cdkClosureApprove(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_APPROVE, { pathParams: { "target": args.target }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 创建持久任务，push必须给code_id；queued并非远端完成 */
    async cdkClosureRequestEffect(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_REQUEST_EFFECT, { pathParams: { "target": args.target }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 脱敏读取独立MySQL来源配置，生产协议仍待核实 */
    async cdkClosureMysqlGet(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_MYSQL_GET, { pathParams: { "target": args.target } }, options);
        return out;
    }
    /** 新鲜管理员CAS保存独立Vault数据库凭据，配置换代使旧任务失效 */
    async cdkClosureMysqlConfigure(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_MYSQL_CONFIGURE, { pathParams: { "target": args.target }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 兑换码目录和真实核销状态 */
    async cdkManagementList(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_MANAGEMENT_LIST, { query: { "before": args?.before, "limit": args?.limit, "q": args?.q, "batch_id": args?.batchId, "status": args?.status, "channel": args?.channel, "include_deleted": args?.includeDeleted } }, options);
        return out;
    }
    /** 批量生成或创建自定义码，金额使用整数quota */
    async cdkManagementCreate(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_MANAGEMENT_CREATE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 人类管理员读取兑换码详情 */
    async cdkManagementDetail(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_MANAGEMENT_DETAIL, { pathParams: { "id": args.id } }, options);
        return out;
    }
    /** 软归档，保留核销、账本和历史码身份 */
    async cdkManagementArchive(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_MANAGEMENT_ARCHIVE, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 版本 CAS 启停，不复活耗尽或过期码 */
    async cdkManagementStatus(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_MANAGEMENT_STATUS, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 新鲜人类会话审计导出，防CSV公式注入 */
    async cdkManagementExport(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_MANAGEMENT_EXPORT, { query: { "format": args?.format, "batch_id": args?.batchId } }, options);
        return out;
    }
    /** 新鲜人类管理员读取真实目标、连接、批准与完整发布快照；不含原码和凭据材料 */
    async cdkManagementSyncStatus(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_MANAGEMENT_SYNC_STATUS, { query: { "target": args?.target } }, options);
        return out;
    }
    /** 需显式选择目标和动作，不安排任何批量推送 */
    async cdkManagementSync(args, options) {
        await executeOperation(this.cfg, OP_CDK_MANAGEMENT_SYNC, { idempotencyKey: args.idempotencyKey }, options);
        return;
    }
    /** 只读完整发布head的来源核销与冲突；游标绑定目标和run，换run要求409重新查询 */
    async cdkSyncSourceHistory(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_SYNC_SOURCE_HISTORY, { query: { "target": args.target, "cursor": args.cursor, "limit": args.limit } }, options);
        return out;
    }
    /** 人工冻结目标/MySQL/批准/单码版本；仅明确批准或安排单目标读取及单码精确推送，queued不代表完成 */
    async cdkSyncCommand(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_SYNC_COMMAND, { pathParams: { "target": args.target }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 兑换码列表 */
    async adminCdkCodeList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_CDK_CODE_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "code": args?.code, "channel": args?.channel, "status": args?.status, "batch_id": args?.batchId } }, options);
        return out;
    }
    /** 兑换码启停 */
    async adminCdkCodeStatus(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_CDK_CODE_STATUS, { pathParams: { "code": args.code }, body: args.body }, options);
        return out;
    }
    /** 核销记录 */
    async adminRedemptionList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_REDEMPTION_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "code": args?.code, "user_id": args?.userId } }, options);
        return out;
    }
    /** 分页查询邀请状态，排除原票据和哈希 */
    async centerInvitationsList(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_INVITATIONS_LIST, { query: { "cursor": args?.cursor, "limit": args?.limit, "status": args?.status } }, options);
        return out;
    }
    /** 原子创建邀请和邮件outbox，重发撤销旧票据 */
    async centerInvitationsCreate(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_INVITATIONS_CREATE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** CAS撤销邀请，与接受流程线性化竞争 */
    async centerInvitationRevoke(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_INVITATION_REVOKE, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 分页读取唯一XPeach中心成员，不产生平台提权 */
    async centerMembersList(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MEMBERS_LIST, { query: { "cursor": args?.cursor, "limit": args?.limit, "q": args?.q, "role": args?.role } }, options);
        return out;
    }
    /** 新鲜管理员显式加入现有账户，角色不等于平台管理员 */
    async centerMembersAdd(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MEMBERS_ADD, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 同事务创建账号并加入中心，邮箱尚未证明控制权 */
    async centerMembersCreate(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MEMBERS_CREATE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 移除关系并保留准入墓碑，不封禁账户或撤销其他目录 */
    async centerMemberRemove(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MEMBER_REMOVE, { pathParams: { "user": args.user }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** CAS变更中心角色并撤销对应目录授权，保护最后负责人 */
    async centerMemberRoleChange(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MEMBER_ROLE_CHANGE, { pathParams: { "user": args.user }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** OAuth 客户端列表 */
    async adminClientList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_CLIENT_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "tenant_id": args?.tenantId, "disabled": args?.disabled, "query": args?.query } }, options);
        return out;
    }
    /** 客户端详情 */
    async adminClientDetail(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_CLIENT_DETAIL, { pathParams: { "clientId": args.clientId } }, options);
        return out;
    }
    /** 客户端启停 */
    async adminClientDisabled(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_CLIENT_DISABLED, { pathParams: { "clientId": args.clientId }, body: args.body }, options);
        return out;
    }
    /** 审计并导出剥离认证机密的冻结副本 */
    async cloudProjectionExport(args, options) {
        const out = await executeOperation(this.cfg, OP_CLOUD_PROJECTION_EXPORT, { query: { "format": args?.format } }, options);
        return out;
    }
    /** 保留旧版同步日志并展示真实结果 */
    async cloudProjectionHistory(args, options) {
        const out = await executeOperation(this.cfg, OP_CLOUD_PROJECTION_HISTORY, { query: { "before": args?.before, "limit": args?.limit } }, options);
        return out;
    }
    /** 分页读取真实云副本任务与逐目标结果 */
    async cloudProjectionRunsList(args, options) {
        const out = await executeOperation(this.cfg, OP_CLOUD_PROJECTION_RUNS_LIST, { query: { "before": args?.before, "limit": args?.limit } }, options);
        return out;
    }
    /** 冻结只读快照并排队执行，回执不代表成功 */
    async cloudProjectionRun(args, options) {
        const out = await executeOperation(this.cfg, OP_CLOUD_PROJECTION_RUN, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 批准经摘要核对的SQLite来源导入 */
    async centerFinanceImportCreate(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_FINANCE_IMPORT_CREATE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 只读一致SQLite快照检查与摘要，不排队、不写账务 */
    async centerFinanceImportInspect(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_FINANCE_IMPORT_INSPECT, { body: args.body }, options);
        return out;
    }
    /** 只查询完整成功批次发布的最新财务观测 */
    async centerFinanceObservations(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_FINANCE_OBSERVATIONS, { query: { "after": args?.after, "limit": args?.limit, "channel": args?.channel, "resource": args?.resource } }, options);
        return out;
    }
    /** 财务来源同步记录 */
    async centerFinanceSyncList(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_FINANCE_SYNC_LIST, { query: { "limit": args?.limit, "before": args?.before } }, options);
        return out;
    }
    /** 批准正式全量分页抓取任务 */
    async centerFinanceSyncCreate(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_FINANCE_SYNC_CREATE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 任务与逐资源持久检查点 */
    async centerFinanceSyncDetail(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_FINANCE_SYNC_DETAIL, { pathParams: { "id": args.id } }, options);
        return out;
    }
    /** 继续或取消财务同步任务 */
    async centerFinanceSyncCancel(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_FINANCE_SYNC_CANCEL, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 查看指定批次的归一化来源事实，要求新鲜管理员会话 */
    async centerFinanceSyncFacts(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_FINANCE_SYNC_FACTS, { pathParams: { "id": args.id }, query: { "after": args.after, "limit": args.limit } }, options);
        return out;
    }
    /** 继续或取消财务同步任务 */
    async centerFinanceSyncRetry(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_FINANCE_SYNC_RETRY, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 财务审计事件列表（finance_audit_events；sheet_id 命中 target_key 或快照 sheet_id） */
    async adminFinanceAudit(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_AUDIT, { query: { "sheet_id": args?.sheetId, "limit": args?.limit } }, options);
        return out;
    }
    /** 财务审计事件 */
    async adminFinanceAuditEvents(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_AUDIT_EVENTS, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "target_table": args?.targetTable, "actor_user_id": args?.actorUserId, "event_type": args?.eventType } }, options);
        return out;
    }
    /** Stripe Issuing 流水 */
    async adminCardEventList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_CARD_EVENT_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "roster_id": args?.rosterId, "status": args?.status, "week_key": args?.weekKey } }, options);
        return out;
    }
    /** 保留原金额并显示账簿冲正关系的现金历史 */
    async adminCashEntryList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_CASH_ENTRY_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "funding_source": args?.fundingSource, "entry_kind": args?.entryKind, "currency": args?.currency } }, options);
        return out;
    }
    /** 公司卡周表 */
    async adminCompanyCardWeeks(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_COMPANY_CARD_WEEKS, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "week_key": args?.weekKey } }, options);
        return out;
    }
    /** 资金池 */
    async adminFundPoolList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FUND_POOL_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** FX 快照（0008 头+报价展开） */
    async adminFxSnapshotList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FX_SNAPSHOT_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 批准机器费用申报主体 */
    async financeIntegrityMachineBinding(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_INTEGRITY_MACHINE_BINDING, { csrfToken: args.xCsrfToken, body: args.body }, options);
        return out;
    }
    /** 批准机器站点观测刷新 */
    async financeIntegrityRefreshBinding(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_INTEGRITY_REFRESH_BINDING, { csrfToken: args.xCsrfToken, body: args.body }, options);
        return out;
    }
    /** 读取分币种财务快照与明确未核项 */
    async financeIntegritySnapshot(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_INTEGRITY_SNAPSHOT, { query: { "site": args?.site } }, options);
        return out;
    }
    /** 单中心财务治理目录、完整周合计与分页 */
    async financeManagementOverview(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_MANAGEMENT_OVERVIEW, { query: { "week": args.week, "currency": args.currency, "page": args.page } }, options);
        return out;
    }
    /** 当前管理员按稳定ID读取资金/收款资料/卡/周表/分录的版本化依赖 */
    async financeManagementLookup(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_MANAGEMENT_LOOKUP, { body: args.body }, options);
        return out;
    }
    /** 新鲜人类会话、CSRF及事务内管理员复核的财务命令 */
    async financeManagementCommand(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_MANAGEMENT_COMMAND, { pathParams: { "action": args.action, "key": args.key }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 财务经营总览：原币分列、账载净额、存储观测，不触发资金变更 */
    async adminFinanceOverview(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_OVERVIEW, { query: { "range": args?.range, "start": args?.start, "end": args?.end, "currency": args?.currency, "source": args?.source, "site_code": args?.siteCode } }, options);
        return out;
    }
    /** 财务来源版本与原子发布头 */
    async financeProjectionList(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_PROJECTION_LIST, { query: { "after": args?.after, "limit": args?.limit } }, options);
        return out;
    }
    /** 完整已封来源转为不可变typed批次，不授予付款能力 */
    async financeProjectionStart(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_PROJECTION_START, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 同一一致快照完整逐笔23列、周表和付款CSV，超预算拒绝 */
    async financeProjectionExport(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_PROJECTION_EXPORT, { query: { "kind": args.kind, "currency": args.currency, "source_key": args.sourceKey, "start": args.start, "end": args.end, "week": args.week, "profile": args.profile } }, options);
        return out;
    }
    /** 按稳定名称读取来源身份与CAS版本，不依赖目录分页 */
    async financeProjectionSourceLookup(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_PROJECTION_SOURCE_LOOKUP, { query: { "source_key": args.sourceKey } }, options);
        return out;
    }
    /** 逐资源count、金额、哈希和未核事实 */
    async financeProjectionDetail(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_PROJECTION_DETAIL, { pathParams: { "id": args.id } }, options);
        return out;
    }
    /** 读取同一快照的五表补全状态 */
    async financeHistoryCompletionDetail(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_HISTORY_COMPLETION_DETAIL, { pathParams: { "id": args.id } }, options);
        return out;
    }
    /** 核对同一SQLite快照的补充历史资料 */
    async financeHistoryCompletionStart(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_HISTORY_COMPLETION_START, { pathParams: { "id": args.id }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 读取脱敏历史元数据分页 */
    async financeHistoryCompletionRecords(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_HISTORY_COMPLETION_RECORDS, { pathParams: { "id": args.id }, query: { "resource": args.resource, "after": args.after, "limit": args.limit } }, options);
        return out;
    }
    /** 按字段核对历史私有原文 */
    async financeIntegrityPrivateFields(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_INTEGRITY_PRIVATE_FIELDS, { pathParams: { "id": args.id }, csrfToken: args.xCsrfToken, body: args.body }, options);
        return out;
    }
    /** 严格typed明细及稳定游标，禁止私有原始材料 */
    async financeProjectionRecords(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_PROJECTION_RECORDS, { pathParams: { "id": args.id }, query: { "resource": args.resource, "after": args.after, "limit": args.limit } }, options);
        return out;
    }
    /** 新鲜人类管理员、CSRF、HMAC幂等与CAS的发布/只读投影回退 */
    async financeProjectionCommand(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_PROJECTION_COMMAND, { pathParams: { "id": args.id, "action": args.action }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 历史收款明细：与总览同口径过滤及稳定游标分页 */
    async adminFinanceReceipts(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_RECEIPTS, { query: { "range": args?.range, "start": args?.start, "end": args?.end, "currency": args?.currency, "source": args?.source, "site_code": args?.siteCode, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 清分差错 */
    async adminResolutionErrorList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_RESOLUTION_ERROR_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "resolved": args?.resolved, "status": args?.status } }, options);
        return out;
    }
    /** 财务名册 */
    async adminFinanceRoster(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_ROSTER, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 显式名册版本与操作键的启停 */
    async adminFinanceRosterActive(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_ROSTER_ACTIVE, { pathParams: { "rosterId": args.rosterId }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 周备注（week_key） */
    async adminSheetNoteList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SHEET_NOTE_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "week_key": args?.weekKey } }, options);
        return out;
    }
    /** 显式备注版本、原因及操作键的周备注修改 */
    async adminSheetNotePut(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SHEET_NOTE_PUT, { csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 凭证、收款和资金版本一致的人工付款登记 */
    async adminFinancePay(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_PAY, { pathParams: { "id": args.id }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 未分类历史来源安全元数据，原文保持私有 */
    async adminSourceStateList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SOURCE_STATE_LIST, { query: { "q": args?.q, "classified": args?.classified, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 申报流水 */
    async adminSubmissionList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SUBMISSION_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "week_key": args?.weekKey, "roster_id": args?.rosterId, "currency": args?.currency, "status": args?.status } }, options);
        return out;
    }
    /** 按原申报版本部分或全部批准 */
    async adminFinanceApprove(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_APPROVE, { pathParams: { "id": args.id }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 按原申报版本驳回 */
    async adminFinanceReject(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_REJECT, { pathParams: { "id": args.id }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 保留原币种金额并显示整笔冲正状态的划转历史 */
    async adminTransferList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_TRANSFER_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 周表全量视图（week_key 过滤） */
    async adminWeeklySheetList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_WEEKLY_SHEET_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "week_key": args?.weekKey, "roster_id": args?.rosterId, "currency": args?.currency, "status": args?.status } }, options);
        return out;
    }
    /** 整批申报决策或有凭证付款；关周和重开改用周级路由 */
    async adminWeeklySheetAction(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_WEEKLY_SHEET_ACTION, { pathParams: { "sheetId": args.sheetId, "action": args.action }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 周级版本与原因明确的会计操作 */
    async adminFinanceCloseWeek(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_CLOSE_WEEK, { pathParams: { "week": args.week }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 周级版本与原因明确的会计操作 */
    async adminFinanceCorrectWeek(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_CORRECT_WEEK, { pathParams: { "week": args.week }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 周级版本与原因明确的会计操作 */
    async adminFinanceReopenWeek(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_FINANCE_REOPEN_WEEK, { pathParams: { "week": args.week }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 读取旧待审核及当前已审核中心默认角色 */
    async centerRoleDefaultsGet(options) {
        const out = await executeOperation(this.cfg, OP_CENTER_ROLE_DEFAULTS_GET, {}, options);
        return out;
    }
    /** 按权限组版本和默认版本审核中心成员默认角色 */
    async centerRoleDefaultWrite(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_ROLE_DEFAULT_WRITE, { pathParams: { "group": args.group }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 中心成员角色与逐站权限意图同事务，头衔是中心资料，不授平台权限 */
    async centerUserRoleBundle(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_USER_ROLE_BUNDLE, { pathParams: { "userId": args.userId }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 真实邮件投递记录 */
    async centerMailLogs(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MAIL_LOGS, { query: { "limit": args?.limit, "before": args?.before } }, options);
        return out;
    }
    /** 安全邮件模板预览 */
    async centerMailPreview(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MAIL_PREVIEW, { body: args.body }, options);
        return out;
    }
    /** 完整邮件模板列表 */
    async centerMailTemplatesList(options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MAIL_TEMPLATES_LIST, {}, options);
        return out;
    }
    /** 版本CAS保存邮件模板 */
    async centerMailTemplatePut(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MAIL_TEMPLATE_PUT, { pathParams: { "key": args.key }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 测试邮件入队，状态不代表远端签收 */
    async centerMailTest(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MAIL_TEST, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 只读解析旧后台页面；未知目录拒绝，不创建发行目录 */
    async legacyNavigationResolve(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_NAVIGATION_RESOLVE, { query: { "entry": args.entry, "slug": args.slug, "client_id": args.clientId } }, options);
        return out;
    }
    /** 新鲜人类管理员读取可核实的身份源配置状态；真实供方仍未核 */
    async oauthConnectionsProviders(options) {
        const out = await executeOperation(this.cfg, OP_OAUTH_CONNECTIONS_PROVIDERS, {}, options);
        return out;
    }
    /** 新鲜人类管理员查询全局身份绑定，敏感搜索仅请求体且窄审计 */
    async oauthConnectionsSearch(args, options) {
        const out = await executeOperation(this.cfg, OP_OAUTH_CONNECTIONS_SEARCH, { csrfToken: args.xCsrfToken, body: args.body }, options);
        return out;
    }
    /** 从本机正式Discovery与JWKS读取真实接入资料；无提供方网络回退 */
    async oauthIntegrationGet(options) {
        const out = await executeOperation(this.cfg, OP_OAUTH_INTEGRATION_GET, {}, options);
        return out;
    }
    /** 全量订单视图 */
    async adminOrderList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_ORDER_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "user_id": args?.userId, "site_code": args?.siteCode, "status": args?.status, "order_ref": args?.orderRef } }, options);
        return out;
    }
    /** 出站通知目录与真实投递摘要 */
    async outboundWebhooksList(args, options) {
        const out = await executeOperation(this.cfg, OP_OUTBOUND_WEBHOOKS_LIST, { query: { "before": args?.before, "limit": args?.limit } }, options);
        return out;
    }
    /** 创建出站通知及可选签名密钥 */
    async outboundWebhookCreate(args, options) {
        const out = await executeOperation(this.cfg, OP_OUTBOUND_WEBHOOK_CREATE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 版本 CAS 编辑出站通知 */
    async outboundWebhookUpdate(args, options) {
        const out = await executeOperation(this.cfg, OP_OUTBOUND_WEBHOOK_UPDATE, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 移除通知并保留历史投递 */
    async outboundWebhookDelete(args, options) {
        const out = await executeOperation(this.cfg, OP_OUTBOUND_WEBHOOK_DELETE, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 逐次投递记录，不读取原始敏感载荷 */
    async outboundWebhookDeliveries(args, options) {
        const out = await executeOperation(this.cfg, OP_OUTBOUND_WEBHOOK_DELIVERIES, { pathParams: { "id": args.id }, query: { "before": args.before, "limit": args.limit } }, options);
        return out;
    }
    /** 测试通知入队，不代表已送达 */
    async outboundWebhookPing(args, options) {
        const out = await executeOperation(this.cfg, OP_OUTBOUND_WEBHOOK_PING, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 失败通知重新排队 */
    async outboundWebhookRetry(args, options) {
        const out = await executeOperation(this.cfg, OP_OUTBOUND_WEBHOOK_RETRY, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 对账/补单申请（真实执行仅 internalKey） */
    async adminReconcileRequest(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_RECONCILE_REQUEST, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 权限组、实际SSO身份、期望分配与真实回读状态 */
    async permissionMatrixRead(args, options) {
        const out = await executeOperation(this.cfg, OP_PERMISSION_MATRIX_READ, { query: { "target": args?.target, "q": args?.q, "group": args?.group, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 完整下游尝试、外部部分写入与回读历史 */
    async permissionDispatchList(args, options) {
        const out = await executeOperation(this.cfg, OP_PERMISSION_DISPATCH_LIST, { query: { "target": args?.target, "before": args?.before, "limit": args?.limit } }, options);
        return out;
    }
    /** 新建重试任务并保留旧尝试与关联，过期任务拒绝重放 */
    async permissionDispatchRetry(args, options) {
        const out = await executeOperation(this.cfg, OP_PERMISSION_DISPATCH_RETRY, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** CAS审核权限组和倍率，可排队发送选定下游 */
    async permissionGroupWrite(args, options) {
        const out = await executeOperation(this.cfg, OP_PERMISSION_GROUP_WRITE, { pathParams: { "name": args.name }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 保存应用绑定的下游连接与目的绑定v4令牌 */
    async permissionTargetWrite(args, options) {
        const out = await executeOperation(this.cfg, OP_PERMISSION_TARGET_WRITE, { pathParams: { "targetKey": args.targetKey }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 原子登记至多100个用户的期望与outbox，未回读不生效 */
    async permissionBatchAssign(args, options) {
        const out = await executeOperation(this.cfg, OP_PERMISSION_BATCH_ASSIGN, { pathParams: { "targetKey": args.targetKey }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 仅重发已审核的期望，绝不根据镜像自动提权 */
    async permissionBatchReconcile(args, options) {
        const out = await executeOperation(this.cfg, OP_PERMISSION_BATCH_RECONCILE, { pathParams: { "targetKey": args.targetKey }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 新鲜管理员核对ID、用户名或邮箱，歧义失败封闭 */
    async permissionTargetsResolve(args, options) {
        const out = await executeOperation(this.cfg, OP_PERMISSION_TARGETS_RESOLVE, { pathParams: { "targetKey": args.targetKey }, body: args.body }, options);
        return out;
    }
    /** 平台管理员清单 */
    async adminPlatformAdminList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_PLATFORM_ADMIN_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 受控授权（审批引用必填） */
    async adminPlatformAdminGrant(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_PLATFORM_ADMIN_GRANT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 撤销管理员（最后管理员保护→break-glass） */
    async adminPlatformAdminRevoke(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_PLATFORM_ADMIN_REVOKE, { pathParams: { "userId": args.userId } }, options);
        return out;
    }
    /** 迁移批次列表 */
    async adminRuntimeMigrations(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_RUNTIME_MIGRATIONS, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 迁移对账 */
    async adminRuntimeMigrateReconcile(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_RUNTIME_MIGRATE_RECONCILE, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 发布状态只读代理视图（generation 查询） */
    async adminRuntimeReleaseState(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_RUNTIME_RELEASE_STATE, { pathParams: { "cutoverId": args.cutoverId }, query: { "generation": args.generation } }, options);
        return out;
    }
    /** 四分支退役探针 */
    async adminRuntimeRetireProbe(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_RUNTIME_RETIRE_PROBE, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 双来源稳定分页，受控UA与风险组合筛选 */
    async securityAuditList(args, options) {
        const out = await executeOperation(this.cfg, OP_SECURITY_AUDIT_LIST, { query: { "since": args?.since, "until": args?.until, "source": args?.source, "event": args?.event, "actor": args?.actor, "target": args?.target, "ip": args?.ip, "directory": args?.directory, "outcome": args?.outcome, "category": args?.category, "ua": args?.ua, "os": args?.os, "browser": args?.browser, "device": args?.device, "severity": args?.severity, "limit": args?.limit, "cursor": args?.cursor } }, options);
        return out;
    }
    /** 新鲜人类管理员会话完整导出审计；超过10000行或8MiB拒绝 */
    async securityAuditExport(args, options) {
        const out = await executeOperation(this.cfg, OP_SECURITY_AUDIT_EXPORT, { query: { "since": args?.since, "until": args?.until, "source": args?.source, "event": args?.event, "actor": args?.actor, "target": args?.target, "ip": args?.ip, "directory": args?.directory, "outcome": args?.outcome, "category": args?.category, "ua": args?.ua, "os": args?.os, "browser": args?.browser, "device": args?.device, "severity": args?.severity } }, options);
        return out;
    }
    /** 同交集只读快照中的认证分母和独立风险趋势 */
    async securityAuditOverview(args, options) {
        const out = await executeOperation(this.cfg, OP_SECURITY_AUDIT_OVERVIEW, { query: { "since": args?.since, "until": args?.until, "source": args?.source, "event": args?.event, "actor": args?.actor, "target": args?.target, "ip": args?.ip, "directory": args?.directory, "outcome": args?.outcome, "category": args?.category, "ua": args?.ua, "os": args?.os, "browser": args?.browser, "device": args?.device, "severity": args?.severity } }, options);
        return out;
    }
    /** 新鲜管理员会话目录；不返回任何原始认证材料 */
    async adminSessionList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SESSION_LIST, { query: { "q": args?.q, "user_id": args?.userId, "client_id": args?.clientId, "issuer": args?.issuer, "cursor": args?.cursor, "kind": args?.kind, "status": args?.status, "limit": args?.limit } }, options);
        return out;
    }
    /** 指定主体、发行方、应用和版本的精确撤销 */
    async adminSessionRevoke(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SESSION_REVOKE, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 服务Key能力目录 */
    async adminServiceKeyPermissions(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SERVICE_KEY_PERMISSIONS, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 服务Key列表（契约登记·服务端未实现；Console listServiceKeys 当前 405） */
    async adminServiceKeyList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SERVICE_KEY_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "site_code": args?.siteCode, "disabled": args?.disabled, "query": args?.query } }, options);
        return out;
    }
    /** 签发细粒度服务Key（caller/能力/对象；成本键不授wallet/封号） */
    async adminServiceKeyCreate(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SERVICE_KEY_CREATE, { body: args.body }, options);
        return out;
    }
    /** 服务Key启停 */
    async adminServiceKeyDisabled(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SERVICE_KEY_DISABLED, { pathParams: { "keyId": args.keyId }, body: args.body }, options);
        return out;
    }
    /** 读取完整财务渠道配置，机密只返回可核实状态 */
    async centerBillingSettingsGet(options) {
        const out = await executeOperation(this.cfg, OP_CENTER_BILLING_SETTINGS_GET, {}, options);
        return out;
    }
    /** 版本CAS与独立用途凭据变更，未知旧信封保全 */
    async centerBillingSettingsSave(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_BILLING_SETTINGS_SAVE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 正式渠道只读查单并审计，不能制造付款证明或钱包分录 */
    async centerBillingProviderProbe(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_BILLING_PROVIDER_PROBE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 按整数金额试算配置费率，不写实际账务 */
    async centerBillingFeeSimulation(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_BILLING_FEE_SIMULATION, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 按明确批准计划排队只读来源同步 */
    async centerBillingSync(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_BILLING_SYNC, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 读取中心设置：Captcha */
    async centerCaptchaGet(options) {
        const out = await executeOperation(this.cfg, OP_CENTER_CAPTCHA_GET, {}, options);
        return out;
    }
    /** 保存中心设置：Captcha */
    async centerCaptchaPut(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_CAPTCHA_PUT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 读取云副本设置及明确凭据状态 */
    async cloudProjectionSettingsGet(options) {
        const out = await executeOperation(this.cfg, OP_CLOUD_PROJECTION_SETTINGS_GET, {}, options);
        return out;
    }
    /** 版本 CAS 保存云副本设置 */
    async cloudProjectionSettingsPut(args, options) {
        const out = await executeOperation(this.cfg, OP_CLOUD_PROJECTION_SETTINGS_PUT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 读取中心设置：General */
    async centerGeneralGet(options) {
        const out = await executeOperation(this.cfg, OP_CENTER_GENERAL_GET, {}, options);
        return out;
    }
    /** 保存中心设置：General */
    async centerGeneralPut(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_GENERAL_PUT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 共享接口凭据目录，不回显密文或明文 */
    async centerInterfacesList(options) {
        const out = await executeOperation(this.cfg, OP_CENTER_INTERFACES_LIST, {}, options);
        return out;
    }
    /** 版本 CAS 修改共享接口凭据 */
    async centerInterfaceUpdate(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_INTERFACE_UPDATE, { pathParams: { "credential": args.credential }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 读取中心设置：Mail */
    async centerMailGet(options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MAIL_GET, {}, options);
        return out;
    }
    /** 保存中心设置：Mail */
    async centerMailPut(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_MAIL_PUT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 身份提供方目录 */
    async centerOauthList(options) {
        const out = await executeOperation(this.cfg, OP_CENTER_OAUTH_LIST, {}, options);
        return out;
    }
    /** 读取并精确核对OIDC发现文档 */
    async centerOauthDiscovery(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_OAUTH_DISCOVERY, { body: args.body }, options);
        return out;
    }
    /** 版本CAS保存身份提供方 */
    async centerOauthPut(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_OAUTH_PUT, { pathParams: { "provider": args.provider }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 读取中心设置：Security */
    async centerSecurityGet(options) {
        const out = await executeOperation(this.cfg, OP_CENTER_SECURITY_GET, {}, options);
        return out;
    }
    /** 保存中心设置：Security */
    async centerSecurityPut(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_SECURITY_PUT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 同一重复读快照的全局筛选、分组与跨站分析；观测不是中心钱包 */
    async siteObservationAnalysis(args, options) {
        const out = await executeOperation(this.cfg, OP_SITE_OBSERVATION_ANALYSIS, { query: { "site": args?.site, "group": args?.group, "q": args?.q, "cohort": args?.cohort, "tier": args?.tier, "activity": args?.activity, "sort": args?.sort, "view": args?.view, "presence": args?.presence, "source_token": args?.sourceToken, "page": args?.page, "page_size": args?.pageSize } }, options);
        return out;
    }
    /** 新鲜人类管理员导出完整筛选结果，拒绝静默截断并记录窄审计 */
    async siteObservationExport(args, options) {
        const out = await executeOperation(this.cfg, OP_SITE_OBSERVATION_EXPORT, { query: { "site": args?.site, "group": args?.group, "q": args?.q, "cohort": args?.cohort, "tier": args?.tier, "activity": args?.activity, "sort": args?.sort, "view": args?.view, "presence": args?.presence, "source_token": args?.sourceToken } }, options);
        return out;
    }
    /** 读取可审核的自营站点观测来源，不返回密钥或密文 */
    async siteObservationTargets(options) {
        const out = await executeOperation(this.cfg, OP_SITE_OBSERVATION_TARGETS, {}, options);
        return out;
    }
    /** 审核当前目的地、实例、应用和数据库用途凭据归属 */
    async siteObservationApprove(args, options) {
        const out = await executeOperation(this.cfg, OP_SITE_OBSERVATION_APPROVE, { pathParams: { "target": args.target }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 读取最近一百个真实持久采集任务及区间，不等同下游实时余额 */
    async siteObservationRuns(args, options) {
        const out = await executeOperation(this.cfg, OP_SITE_OBSERVATION_RUNS, { pathParams: { "target": args.target } }, options);
        return out;
    }
    /** 新鲜人类管理员启动只读分页扫描，queued不代表已发布 */
    async siteObservationStart(args, options) {
        const out = await executeOperation(this.cfg, OP_SITE_OBSERVATION_START, { pathParams: { "target": args.target }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 读取显式批准的周期只读采集策略和暂停原因 */
    async siteObservationScheduleGet(args, options) {
        const out = await executeOperation(this.cfg, OP_SITE_OBSERVATION_SCHEDULE_GET, { pathParams: { "target": args.target } }, options);
        return out;
    }
    /** 新鲜人类管理员CAS批准或停用持久采集策略，连续五个失败run自动暂停 */
    async siteObservationSchedulePut(args, options) {
        const out = await executeOperation(this.cfg, OP_SITE_OBSERVATION_SCHEDULE_PUT, { pathParams: { "target": args.target }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 站点列表 */
    async adminSiteList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SITE_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 站点模块开关/draining */
    async adminSiteModuleMode(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_SITE_MODULE_MODE, { pathParams: { "siteCode": args.siteCode }, body: args.body }, options);
        return out;
    }
    /** 读取中心状态及各站最新代次回执，不把中心成功冒充全站成功 */
    async accountStatusSyncGet(args, options) {
        const out = await executeOperation(this.cfg, OP_ACCOUNT_STATUS_SYNC_GET, { pathParams: { "userId": args.userId } }, options);
        return out;
    }
    /** 新鲜人类管理员CAS启停，同事务撤销凭据和建立持久下游意图 */
    async accountStatusSyncChange(args, options) {
        const out = await executeOperation(this.cfg, OP_ACCOUNT_STATUS_SYNC_CHANGE, { pathParams: { "userId": args.userId }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 预览九十天前到期的认证临时记录 */
    async centerSystemMaintenancePreview(options) {
        const out = await executeOperation(this.cfg, OP_CENTER_SYSTEM_MAINTENANCE_PREVIEW, {}, options);
        return out;
    }
    /** 按相同快照幂等清理到期认证临时记录 */
    async centerSystemMaintenanceRun(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_SYSTEM_MAINTENANCE_RUN, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 真实中心统计与运行信息 */
    async centerSystemOverview(options) {
        const out = await executeOperation(this.cfg, OP_CENTER_SYSTEM_OVERVIEW, {}, options);
        return out;
    }
    /** 已撤回：XPeach单中心不提供租户治理 */
    async adminTenantList(options) {
        await executeOperation(this.cfg, OP_ADMIN_TENANT_LIST, {}, options);
        return;
    }
    /** 已撤回：XPeach单中心不提供租户治理 */
    async adminTenantDetail(args, options) {
        await executeOperation(this.cfg, OP_ADMIN_TENANT_DETAIL, { pathParams: { "tenantId": args.tenantId } }, options);
        return;
    }
    /** 已撤回：XPeach单中心不提供租户治理 */
    async adminTenantStatus(args, options) {
        await executeOperation(this.cfg, OP_ADMIN_TENANT_STATUS, { pathParams: { "tenantId": args.tenantId } }, options);
        return;
    }
    /** 明确同意后主动翻译公开设置草稿；持久幂等，202为执行中，不自动保存或重发 */
    async translationCreate(args, options) {
        const out = await executeOperation(this.cfg, OP_TRANSLATION_CREATE, { csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 新鲜人类管理员读取显式翻译配置和预算，未向提供方发送正文 */
    async translationCapabilities(options) {
        const out = await executeOperation(this.cfg, OP_TRANSLATION_CAPABILITIES, {}, options);
        return out;
    }
    /** 仅原请求人以新鲜管理员会话读取用途绑定密文结果；过期不重新外发 */
    async translationGet(args, options) {
        const out = await executeOperation(this.cfg, OP_TRANSLATION_GET, { pathParams: { "id": args.id } }, options);
        return out;
    }
    /** 停止后续语言，已发请求的结果按实际完成记录，不伪造撤销提供方收费 */
    async translationCancel(args, options) {
        const out = await executeOperation(this.cfg, OP_TRANSLATION_CANCEL, { pathParams: { "id": args.id }, csrfToken: args.xCsrfToken }, options);
        return out;
    }
    /** 用户列表（过滤+游标分页） */
    async adminUserList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_USER_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "status": args?.status } }, options);
        return out;
    }
    /** 创建用户，不能自授已验证邮箱 */
    async userDirectoryCreate(args, options) {
        const out = await executeOperation(this.cfg, OP_USER_DIRECTORY_CREATE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 审计导出完整筛选结果，防 CSV 公式注入 */
    async userDirectoryExport(args, options) {
        const out = await executeOperation(this.cfg, OP_USER_DIRECTORY_EXPORT, { query: { "q": args?.q, "status": args?.status } }, options);
        return out;
    }
    /** 用户详情（用户+站点行+成员+计数） */
    async adminUserDetail(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_USER_DETAIL, { pathParams: { "userId": args.userId } }, options);
        return out;
    }
    /** 读取排除机密的完整关联目录 */
    async userDirectoryGet(args, options) {
        const out = await executeOperation(this.cfg, OP_USER_DIRECTORY_GET, { pathParams: { "userId": args.userId } }, options);
        return out;
    }
    /** 版本 CAS 编辑基础资料，改邮箱撤销现有证明与会话 */
    async userDirectoryUpdate(args, options) {
        const out = await executeOperation(this.cfg, OP_USER_DIRECTORY_UPDATE, { pathParams: { "userId": args.userId }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 受控用户管理，保护最后登录法和系统资料 */
    async userDirectoryAction(args, options) {
        const out = await executeOperation(this.cfg, OP_USER_DIRECTORY_ACTION, { pathParams: { "userId": args.userId, "action": args.action }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 邀请归属换绑/补绑（串行+防环+历史映射；SECURITY DEFINER 终裁） */
    async adminInviteRebind(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_INVITE_REBIND, { pathParams: { "userId": args.userId }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 邀请归属换绑历史流水（journal_no 倒序；before 游标） */
    async adminInviteHistory(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_INVITE_HISTORY, { pathParams: { "userId": args.userId }, query: { "site_code": args.siteCode, "before": args.before, "limit": args.limit } }, options);
        return out;
    }
    /** 现役人类平台管理员读取安全计数及最近20个恢复请求，不返回任何因子/会话指纹 */
    async mfaRecoveryList(args, options) {
        const out = await executeOperation(this.cfg, OP_MFA_RECOVERY_LIST, { pathParams: { "userId": args.userId } }, options);
        return out;
    }
    /** 第一名非目标管理员登记30分钟恢复请求；此步不清除任何因子 */
    async mfaRecoveryRequest(args, options) {
        const out = await executeOperation(this.cfg, OP_MFA_RECOVERY_REQUEST, { pathParams: { "userId": args.userId }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 第二名不同且非目标的管理员复核后原子清TOTP与恢复码、撤销认证并入队通知 */
    async mfaRecoveryApprove(args, options) {
        const out = await executeOperation(this.cfg, OP_MFA_RECOVERY_APPROVE, { pathParams: { "userId": args.userId, "requestId": args.requestId }, csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 用户停用/恢复（SERIALIZABLE治理入口+锁序+审计；最后管理员保护） */
    async adminUserStatus(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_USER_STATUS, { pathParams: { "userId": args.userId }, csrfToken: args.xCsrfToken, body: args.body }, options);
        return out;
    }
    /** 清锁定/失败计数 */
    async adminUserUnlock(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_USER_UNLOCK, { pathParams: { "userId": args.userId }, body: args.body }, options);
        return out;
    }
    /** 受控调账申请（审批追踪；真实执行仅 internalKey/serviceKey） */
    async adminWalletAdjust(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_WALLET_ADJUST, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 全量预占视图 */
    async adminReservationList(args, options) {
        const out = await executeOperation(this.cfg, OP_ADMIN_RESERVATION_LIST, { query: { "q": args?.q, "cursor": args?.cursor, "limit": args?.limit, "user_id": args?.userId, "site_code": args?.siteCode, "state": args?.state } }, options);
        return out;
    }
    /** 旧地址兼容：关于 */
    async publicAboutGet(args, options) {
        const out = await executeOperation(this.cfg, OP_PUBLIC_ABOUT_GET, { query: { "lang": args?.lang } }, options);
        return out;
    }
    /** 真实财务快照及分币种/未知依据 */
    async legacyBusinessBillingSummaryBlocked(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_BILLING_SUMMARY_BLOCKED, { query: { "site": args?.site, "refresh": args?.refresh } }, options);
        return out;
    }
    /** 显式不改钱包时保存待核验观测 */
    async legacyBusinessFinanceEventsInternal(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_FINANCE_EVENTS_INTERNAL, { body: args.body }, options);
        return out;
    }
    /** 真实财务站点矩阵及分层依据 */
    async legacyBusinessFinanceMatrixInternalBlocked(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_FINANCE_MATRIX_INTERNAL_BLOCKED, { query: { "site": args?.site, "refresh": args?.refresh } }, options);
        return out;
    }
    /** 按本地订单核对充值履约，未核实则待核或拒绝 */
    async legacyBusinessRechargeBlockedInternal(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_RECHARGE_BLOCKED_INTERNAL, { body: args.body }, options);
        return out;
    }
    /** 旧内部原生登录（X-Internal-Service-Key；不签发 token；§3） */
    async v1InternalNativeAuth(args, options) {
        const out = await executeOperation(this.cfg, OP_V1_INTERNAL_NATIVE_AUTH, { body: args.body }, options);
        return out;
    }
    /** 正式OP验签后的本人资料 */
    async legacyBusinessProfileGet(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_PROFILE_GET, { query: { "site": args?.site } }, options);
        return out;
    }
    /** 本人资料与受控站点资料原子更新 */
    async legacyBusinessProfileWrite(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_PROFILE_WRITE, { body: args.body }, options);
        return out;
    }
    /** 旧auth_request Bearer验证；JWT八头、opaque六头，失败保留v1 JSON信封 */
    async v1InternalVerify(options) {
        const out = await executeOperation(this.cfg, OP_V1_INTERNAL_VERIFY, {}, options);
        return out;
    }
    /** 旧地址兼容：隐私政策 */
    async publicPrivacyPolicyGet(args, options) {
        const out = await executeOperation(this.cfg, OP_PUBLIC_PRIVACY_POLICY_GET, { query: { "lang": args?.lang } }, options);
        return out;
    }
    /** 中心公开品牌与注册策略 */
    async centerPublicBrand(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_PUBLIC_BRAND, { query: { "lang": args?.lang } }, options);
        return out;
    }
    /** 旧地址兼容：用户协议 */
    async publicUserAgreementGet(args, options) {
        const out = await executeOperation(this.cfg, OP_PUBLIC_USER_AGREEMENT_GET, { query: { "lang": args?.lang } }, options);
        return out;
    }
    /** 旧核销信封与精确金额兼容；共享秘密仍不能代替本人委托 */
    async cdkClosureLegacyAccountRedeem(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_LEGACY_ACCOUNT_REDEEM, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 旧 v1 原生登录别名（与 /api/internal/native-auth 同 handler；§3） */
    async v1NativeLogin(args, options) {
        const out = await executeOperation(this.cfg, OP_V1_NATIVE_LOGIN, { body: args.body }, options);
        return out;
    }
    /** 旧核销信封与精确金额兼容；共享秘密仍不能代替本人委托 */
    async cdkClosureLegacyClusterRedeem(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_LEGACY_CLUSTER_REDEEM, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** v1 设备授权（信封 ok/api_version/request_id） */
    async v1DeviceAuthorize(args, options) {
        const out = await executeOperation(this.cfg, OP_V1_DEVICE_AUTHORIZE, { ...(args?.body === undefined ? {} : { body: args.body }) }, options);
        return out;
    }
    /** v1 设备令牌轮询（pending/slow_down/denied/expired 分支） */
    async v1DeviceToken(args, options) {
        const out = await executeOperation(this.cfg, OP_V1_DEVICE_TOKEN, { ...(args?.body === undefined ? {} : { body: args.body }) }, options);
        return out;
    }
    /** 显式不改钱包时保存待核验观测 */
    async legacyBusinessFinanceEventsV1(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_FINANCE_EVENTS_V1, { body: args.body }, options);
        return out;
    }
    /** 真实财务站点矩阵及分层依据 */
    async legacyBusinessFinanceMatrixV1Blocked(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_FINANCE_MATRIX_V1_BLOCKED, { query: { "site": args?.site, "refresh": args?.refresh } }, options);
        return out;
    }
    /** 按本地订单核对充值履约，未核实则待核或拒绝 */
    async legacyBusinessRechargeBlockedV1(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_RECHARGE_BLOCKED_V1, { body: args.body }, options);
        return out;
    }
    /** v1 OpenAPI 文档导出 */
    async v1OpenapiJson(options) {
        const out = await executeOperation(this.cfg, OP_V1_OPENAPI_JSON, {}, options);
        return out;
    }
    /** v1 桃码凭据（登录态校验） */
    async v1PeachcodeCredentials(options) {
        const out = await executeOperation(this.cfg, OP_V1_PEACHCODE_CREDENTIALS, {}, options);
        return out;
    }
    /** 本人Bearer撤销或全局Internal受控停用；不以机器凭据恢复用户 */
    async v1PeachcodeRevoke(args, options) {
        const out = await executeOperation(this.cfg, OP_V1_PEACHCODE_REVOKE, { ...(args?.body === undefined ? {} : { body: args.body }) }, options);
        return out;
    }
    /** 按不可变用户ID首次绑定邀请归属 */
    async legacyBusinessReferralsBindBody(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_REFERRALS_BIND_BODY, { body: args.body }, options);
        return out;
    }
    /** v1 注册 */
    async v1Register(args, options) {
        const out = await executeOperation(this.cfg, OP_V1_REGISTER, { body: args.body }, options);
        return out;
    }
    /** v1 邮箱领取第二段（new=新账号接管 / continue=原账号续用） */
    async v1RegisterClaim(args, options) {
        const out = await executeOperation(this.cfg, OP_V1_REGISTER_CLAIM, { headers: { "Origin": args.origin }, ...(args.xCsrfToken === undefined ? {} : { csrfToken: args.xCsrfToken }), body: args.body }, options);
        return out;
    }
    /** v1 注册验证（两段式首段 → claim_required） */
    async v1RegisterVerify(args, options) {
        const out = await executeOperation(this.cfg, OP_V1_REGISTER_VERIFY, { body: args.body }, options);
        return out;
    }
    /** v1 社交登录回调 */
    async v1SocialCallback(args, options) {
        await executeOperation(this.cfg, OP_V1_SOCIAL_CALLBACK, { pathParams: { "provider": args.provider } }, options);
        return;
    }
    /** v1 社交登录发起 */
    async v1SocialStart(args, options) {
        const out = await executeOperation(this.cfg, OP_V1_SOCIAL_START, { pathParams: { "provider": args.provider }, body: args.body }, options);
        return out;
    }
    /** 相同邀请码真实无变更；更名缺跨站完整投影时409 */
    async legacyBusinessAffCode(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_AFF_CODE, { pathParams: { "uuid": args.uuid }, body: args.body }, options);
        return out;
    }
    /** 账本权威可用余额与标明来源的历史计数 */
    async legacyBusinessPeachGet(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_PEACH_GET, { pathParams: { "uuid": args.uuid } }, options);
        return out;
    }
    /** 缺正式审批/消费授权时拒绝旧调账 */
    async legacyBusinessPeachAdjustBlocked(args, options) {
        await executeOperation(this.cfg, OP_LEGACY_BUSINESS_PEACH_ADJUST_BLOCKED, { pathParams: { "uuid": args.uuid }, body: args.body }, options);
        return;
    }
    /** 请求已批准xpc目标只读核实既有账号；保留旧HTTP200兼容 */
    async legacyBusinessProvisionBlocked(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_PROVISION_BLOCKED, { pathParams: { "uuid": args.uuid }, query: { "site": args.site, "target_key": args.targetKey } }, options);
        return out;
    }
    /** 本人或显式邀请能力调用方读取两代家谱 */
    async legacyBusinessReferralsGet(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_REFERRALS_GET, { pathParams: { "uuid": args.uuid } }, options);
        return out;
    }
    /** 首次邀请真实绑定；下游未供给状态如实返回 */
    async legacyBusinessReferralsBindPath(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_REFERRALS_BIND_PATH, { pathParams: { "uuid": args.uuid }, body: args.body }, options);
        return out;
    }
    /** 只读费用桥与严格绑定的待核申报 */
    async legacyBusinessCostBridgeOpenclaw(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_COST_BRIDGE_OPENCLAW, { body: args.body }, options);
        return out;
    }
    /** 授权端点（code+PKCE；浏览器身份缺省转交互登录） */
    async oidcAuthorize(args, options) {
        await executeOperation(this.cfg, OP_OIDC_AUTHORIZE, { query: { "client_id": args.clientId, "redirect_uri": args.redirectUri, "response_type": args.responseType, "scope": args.scope, "state": args.state, "code_challenge": args.codeChallenge, "code_challenge_method": args.codeChallengeMethod } }, options);
        return;
    }
    /** 读取单中心统一人机验证公开策略（供主站与客户端统一渲染） */
    async captchaPolicyGet(options) {
        const out = await executeOperation(this.cfg, OP_CAPTCHA_POLICY_GET, {}, options);
        return out;
    }
    /** 第一方下游服务统一通过SSO核验人机验证令牌 */
    async captchaVerify(args, options) {
        const out = await executeOperation(this.cfg, OP_CAPTCHA_VERIFY, { body: args.body }, options);
        return out;
    }
    /** CDK核销（事务幂等防双兑/复活） */
    async cdkRedeem(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_REDEEM, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 旧全局站点CSV完整导出，复用当前新鲜人类管理员认证和窄审计 */
    async siteObservationLegacyExport(args, options) {
        const out = await executeOperation(this.cfg, OP_SITE_OBSERVATION_LEGACY_EXPORT, { query: { "site": args?.site, "group": args?.group, "q": args?.q, "cohort": args?.cohort, "tier": args?.tier, "activity": args?.activity, "sort": args?.sort, "view": args?.view, "presence": args?.presence, "source_token": args?.sourceToken, "page": args?.page, "pageSize": args?.pageSize, "page_size": args?.pageSizeAlias2 } }, options);
        return out;
    }
    /** 旧社交入口导向同一受保护认证流程 */
    async legacyConsoleSocialStart(args, options) {
        await executeOperation(this.cfg, OP_LEGACY_CONSOLE_SOCIAL_START, { pathParams: { "provider": args.provider } }, options);
        return;
    }
    /** 设备授权（RFC8628 device_code grant 起点） */
    async oidcDeviceAuthorization(args, options) {
        const out = await executeOperation(this.cfg, OP_OIDC_DEVICE_AUTHORIZATION, { body: args.body }, options);
        return out;
    }
    /** 本人有效名册的真实报销申报；附件未装配时拒绝 */
    async financeManagementSelfSubmit(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_MANAGEMENT_SELF_SUBMIT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 本人新鲜会话、窗口与名册绑定的申报 */
    async financeSubmit(args, options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_SUBMIT, { csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 周表（本人roster映射） */
    async financeWeeklyList(options) {
        const out = await executeOperation(this.cfg, OP_FINANCE_WEEKLY_LIST, {}, options);
        return out;
    }
    /** 客户端 IP 回显（可信代理解析自检） */
    async healthClientIp(options) {
        const out = await executeOperation(this.cfg, OP_HEALTH_CLIENT_IP, {}, options);
        return out;
    }
    /** 存活探针 */
    async healthLive(options) {
        const out = await executeOperation(this.cfg, OP_HEALTH_LIVE, {}, options);
        return out;
    }
    /** 就绪探针（依赖检查汇总；console healthReady 调用） */
    async healthReady(options) {
        const out = await executeOperation(this.cfg, OP_HEALTH_READY, {}, options);
        return out;
    }
    /** OP 存活探针 */
    async opHealthz(options) {
        const out = await executeOperation(this.cfg, OP_OP_HEALTHZ, {}, options);
        return out;
    }
    /** 只读费用桥与严格绑定的待核申报 */
    async legacyBusinessCostBridgeInternal(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_BUSINESS_COST_BRIDGE_INTERNAL, { body: args.body }, options);
        return out;
    }
    /** 逐批按实际行数、金额、批准差额与未决错误对账 */
    async migrationReconcile(args, options) {
        const out = await executeOperation(this.cfg, OP_MIGRATION_RECONCILE, { query: { "batch_id": args?.batchId, "site_code": args?.siteCode } }, options);
        return out;
    }
    /** PREPARING白名单登记完整迁移批次；同键同体回放 */
    async migrationPrepare(args, options) {
        const out = await executeOperation(this.cfg, OP_MIGRATION_PREPARE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 核对真实恢复资格；资格不足保持403 */
    async recoveryInspect(args, options) {
        const out = await executeOperation(this.cfg, OP_RECOVERY_INSPECT, { pathParams: { "cutoverId": args.cutoverId } }, options);
        return out;
    }
    /** 围栏租约、追加控制面回执并核业务下界；未执行物理恢复 */
    async recoveryRestore(args, options) {
        const out = await executeOperation(this.cfg, OP_RECOVERY_RESTORE, { pathParams: { "cutoverId": args.cutoverId }, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 按权威代次读取完整发布状态 */
    async releaseInspect(args, options) {
        const out = await executeOperation(this.cfg, OP_RELEASE_INSPECT, { pathParams: { "cutoverId": args.cutoverId }, query: { "generation": args.generation } }, options);
        return out;
    }
    /** 实际屏障与代次核验后返回activated及完整状态 */
    async releaseActivate(args, options) {
        const out = await executeOperation(this.cfg, OP_RELEASE_ACTIVATE, { pathParams: { "cutoverId": args.cutoverId }, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** SEAL或ABORT同记录CAS；保持原方向及幂等终裁 */
    async releaseDecide(args, options) {
        const out = await executeOperation(this.cfg, OP_RELEASE_DECIDE, { pathParams: { "cutoverId": args.cutoverId }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 核对H闭合后开放；已OPEN重放返回真实状态 */
    async releaseOpen(args, options) {
        const out = await executeOperation(this.cfg, OP_RELEASE_OPEN, { pathParams: { "cutoverId": args.cutoverId } }, options);
        return out;
    }
    /** 保存PRE_SEAL原始证据并返回真实CAS版本 */
    async releasePreSeal(args, options) {
        const out = await executeOperation(this.cfg, OP_RELEASE_PRE_SEAL, { pathParams: { "cutoverId": args.cutoverId }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 四分支退役探针保留真实null、未知项和诊断说明 */
    async retireProbe(options) {
        const out = await executeOperation(this.cfg, OP_RETIRE_PROBE, {}, options);
        return out;
    }
    /** 终局签收回执（volume+takeover+intent幂等；异载荷409；不重复扣费） */
    async walCenterAck(args, options) {
        const out = await executeOperation(this.cfg, OP_WAL_CENTER_ACK, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** WAL中心裁决（volume+takeover幂等；旧fencing/旧owner拒绝；事实驱动） */
    async walCenterReport(args, options) {
        const out = await executeOperation(this.cfg, OP_WAL_CENTER_REPORT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** JWKS 兼容别名（根 issuer） */
    async oidcJwksAlias(options) {
        const out = await executeOperation(this.cfg, OP_OIDC_JWKS_ALIAS, {}, options);
        return out;
    }
    /** 保留旧七语言公开偏好，JSON请求返回状态，其余仅跳当前中心 */
    async legacyLanguageGet(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_LANGUAGE_GET, { pathParams: { "locale": args.locale }, query: { "return_to": args.returnTo } }, options);
        return out;
    }
    /** 保留旧七语言公开偏好，JSON请求返回状态，其余仅跳当前中心 */
    async legacyLanguagePost(args, options) {
        const out = await executeOperation(this.cfg, OP_LEGACY_LANGUAGE_POST, { pathParams: { "locale": args.locale }, query: { "return_to": args.returnTo } }, options);
        return out;
    }
    /** 当前主体资料 */
    async meGet(options) {
        const out = await executeOperation(this.cfg, OP_ME_GET, {}, options);
        return out;
    }
    /** 受控改密（新鲜认证+MFA适用+确认；写Argon credential_version CAS） */
    async meChangePassword(args, options) {
        const out = await executeOperation(this.cfg, OP_ME_CHANGE_PASSWORD, { csrfToken: args.xCsrfToken, body: args.body }, options);
        return out;
    }
    /** 恢复码核销（规范化→12位sha256/8位bcrypt；同事务审计） */
    async meRecoveryUse(args, options) {
        const out = await executeOperation(this.cfg, OP_ME_RECOVERY_USE, { body: args.body }, options);
        return out;
    }
    /** Prometheus 文本指标 */
    async metricsText(options) {
        const out = await executeOperation(this.cfg, OP_METRICS_TEXT, {}, options);
        return out;
    }
    /** 订单列表（对象归属过滤） */
    async orderList(args, options) {
        const out = await executeOperation(this.cfg, OP_ORDER_LIST, { query: { "user_id": args?.userId, "status": args?.status, "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 创建订单（服务端固定快照） */
    async orderCreate(args, options) {
        const out = await executeOperation(this.cfg, OP_ORDER_CREATE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** adopt入口（源ID+绑定证明+原文引用→业务库同事务入箱入队） */
    async paymentAdopt(args, options) {
        const out = await executeOperation(this.cfg, OP_PAYMENT_ADOPT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 受控对账/补单（真实供方查单→绑定证明→provider_queried→process） */
    async paymentReconcile(args, options) {
        const out = await executeOperation(this.cfg, OP_PAYMENT_RECONCILE, { body: args.body }, options);
        return out;
    }
    /** 读取当前场景的人机验证配置及单耗算术挑战 */
    async portalCaptchaGet(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_CAPTCHA_GET, { query: { "scene": args.scene } }, options);
        return out;
    }
    /** 验证已登记OP请求并建立30分钟浏览器绑定上下文 */
    async portalAuthContinuationPrepare(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_AUTH_CONTINUATION_PREPARE, { body: args.body }, options);
        return out;
    }
    /** 本人邮箱领取及MFA后对同一客户端版本单耗续跑 */
    async portalAuthContinuationResume(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_AUTH_CONTINUATION_RESUME, { body: args.body }, options);
        return out;
    }
    /** 邮箱领取（mode=new 建新账号接管已验证邮箱；mode=continue 占位口令双证明续用→会话Cookie） */
    async portalEmailClaim(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_EMAIL_CLAIM, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 重发验证邮件（不泄露账号存在性） */
    async portalEmailResend(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_EMAIL_RESEND, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 邮箱验证票据核销（verify_email→email_claim 领取票据；票据确认只证明邮箱控制权，不置验证位） */
    async portalEmailVerify(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_EMAIL_VERIFY, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 门户登录（用户名+密码→会话Cookie；可转 totp_required/verify_email_sent） */
    async portalLogin(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_LOGIN, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 登录第二因子恢复码（mfa_ticket+code；消耗型） */
    async portalLoginRecovery(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_LOGIN_RECOVERY, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 登录第二因子 TOTP（mfa_ticket+code→会话Cookie） */
    async portalLoginTotp(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_LOGIN_TOTP, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 登出（吊销当前门户会话） */
    async portalLogout(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_LOGOUT, { ...(args?.body === undefined ? {} : { body: args.body }) }, options);
        return out;
    }
    /** Passkey 认证完成（校验断言→会话Cookie） */
    async passkeyAuthComplete(args, options) {
        const out = await executeOperation(this.cfg, OP_PASSKEY_AUTH_COMPLETE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** Passkey 认证 options（ceremony 开启） */
    async passkeyAuthOptions(args, options) {
        const out = await executeOperation(this.cfg, OP_PASSKEY_AUTH_OPTIONS, { ...(args.xCsrfToken === undefined ? {} : { csrfToken: args.xCsrfToken }), body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 发起密码重置（不泄露账号存在性） */
    async portalPasswordForgot(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_PASSWORD_FORGOT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 凭 ticket 完成密码重置（重置后吊销既有会话） */
    async portalPasswordReset(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_PASSWORD_RESET, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 启用的社交登录提供方清单（登录页渲染用） */
    async portalAuthProviders(options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_AUTH_PROVIDERS, {}, options);
        return out;
    }
    /** 门户注册（可携 invite_code/aff_code；可转 verify_email_sent） */
    async portalRegister(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_REGISTER, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 从HttpOnly浏览器绑定Cookie领取社交MFA票据到内存 */
    async portalSocialMfaTicket(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_SOCIAL_MFA_TICKET, { body: args.body }, options);
        return out;
    }
    /** 社交登录跳转（302→提供方授权页） */
    async socialStart(args, options) {
        await executeOperation(this.cfg, OP_SOCIAL_START, { pathParams: { "provider": args.provider } }, options);
        return;
    }
    /** 社交登录回流（上游 code+state 核销→换码→验签→签会话；302→SPA /auth/callback） */
    async socialCallback(args, options) {
        await executeOperation(this.cfg, OP_SOCIAL_CALLBACK, { pathParams: { "provider": args.provider }, query: { "code": args.code, "state": args.state, "error": args.error } }, options);
        return;
    }
    /** 本人新鲜会话和真实Bearer共同创建绑定码、站点、客户端和原操作键的短时单次委托 */
    async cdkClosureDelegation(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_DELEGATION, { csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 本人核销：资金入账与中心及远端权益分态，机器必须另有有限本人委托 */
    async cdkClosureRedeem(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_REDEEM, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 新鲜登录与已验证受邀邮箱归属双证明后单耗入组，既有角色不隐式升降级 */
    async centerInvitationAccept(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_INVITATION_ACCEPT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 仅展示有效邀请的脱敏信息，不核销；有会话时仍校验CSRF */
    async centerInvitationInspect(args, options) {
        const out = await executeOperation(this.cfg, OP_CENTER_INVITATION_INSPECT, { body: args.body }, options);
        return out;
    }
    /** 设备授权码信息（批准页渲染；不泄露敏感字段） */
    async portalDeviceInfo(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_DEVICE_INFO, { pathParams: { "user_code": args.userCode } }, options);
        return out;
    }
    /** 批准设备码（消费型；一次性） */
    async portalDeviceApprove(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_DEVICE_APPROVE, { pathParams: { "user_code": args.userCode }, ...(args?.body === undefined ? {} : { body: args.body }), idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 拒绝设备码 */
    async portalDeviceDeny(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_DEVICE_DENY, { pathParams: { "user_code": args.userCode }, ...(args?.body === undefined ? {} : { body: args.body }), idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 本人凭据证明后向新邮箱排队验证，尚不修改主邮箱 */
    async selfSecurityEmailRequest(args, options) {
        const out = await executeOperation(this.cfg, OP_SELF_SECURITY_EMAIL_REQUEST, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 新邮箱单耗票据与再次本人凭据证明，同事务绑定并撤销旧授权 */
    async selfSecurityEmailConfirm(args, options) {
        const out = await executeOperation(this.cfg, OP_SELF_SECURITY_EMAIL_CONFIRM, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 按中心邮箱策略受控解绑，保留当前会话 */
    async selfSecurityEmailUnbind(args, options) {
        const out = await executeOperation(this.cfg, OP_SELF_SECURITY_EMAIL_UNBIND, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 正式个人权益消费者读取独立中心投影及跨站状态 */
    async cdkClosureEntitlements(options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_ENTITLEMENTS, {}, options);
        return out;
    }
    /** 读取本人外部身份关联 */
    async selfSecurityIdentities(options) {
        const out = await executeOperation(this.cfg, OP_SELF_SECURITY_IDENTITIES, {}, options);
        return out;
    }
    /** 新鲜双重证明解绑，保护最后登录法并撤销既有授权 */
    async selfSecurityIdentityUnlink(args, options) {
        const out = await executeOperation(this.cfg, OP_SELF_SECURITY_IDENTITY_UNLINK, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 本人新鲜认证、CSRF和专属单耗state发起绑定 */
    async portalIdentityLinkStart(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_IDENTITY_LINK_START, { pathParams: { "provider": args.provider }, body: args.body }, options);
        return out;
    }
    /** 读取本人邀请码和CAS版本 */
    async cdkClosureInvitation(options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_INVITATION, {}, options);
        return out;
    }
    /** 新鲜本人会话CAS更名；中心成功不代表跨站交付 */
    async cdkClosureRename(args, options) {
        const out = await executeOperation(this.cfg, OP_CDK_CLOSURE_RENAME, { csrfToken: args.xCsrfToken, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 门户主体（本人资料+会话态） */
    async portalMe(options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_ME, {}, options);
        return out;
    }
    /** 更新本人资料（display_name/avatar_url/locale） */
    async portalMePatch(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_ME_PATCH, { body: args.body }, options);
        return out;
    }
    /** 恢复码余量/生成时间（不泄露码体） */
    async portalRecoveryCodesStatus(options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_RECOVERY_CODES_STATUS, {}, options);
        return out;
    }
    /** 重生成恢复码（需 totp_code；旧码即废） */
    async portalRecoveryCodesRegenerate(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_RECOVERY_CODES_REGENERATE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** TOTP 确认启用（setup_ticket+code；启用时下发恢复码） */
    async portalTotpConfirm(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_TOTP_CONFIRM, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 停用 TOTP（需当前 totp_code 验证持有） */
    async portalTotpDisable(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_TOTP_DISABLE, { body: args.body }, options);
        return out;
    }
    /** TOTP 设置（下发 secret+otpauth_url+setup_ticket） */
    async portalTotpSetup(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_TOTP_SETUP, { ...(args?.body === undefined ? {} : { body: args.body }), idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 通知列表（cursor 分页） */
    async portalNotifications(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_NOTIFICATIONS, { query: { "cursor": args?.cursor, "limit": args?.limit } }, options);
        return out;
    }
    /** 全部通知标已读 */
    async portalNotificationsReadAll(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_NOTIFICATIONS_READ_ALL, { ...(args?.body === undefined ? {} : { body: args.body }) }, options);
        return out;
    }
    /** 单条通知标已读 */
    async portalNotificationRead(args, options) {
        await executeOperation(this.cfg, OP_PORTAL_NOTIFICATION_READ, { pathParams: { "id": args.id }, csrfToken: args.xCsrfToken }, options);
        return;
    }
    /** 分页列举本人单点登录会话与应用授权，排除凭据定位原文 */
    async selfSecurityOidcSessions(args, options) {
        const out = await executeOperation(this.cfg, OP_SELF_SECURITY_OIDC_SESSIONS, { query: { "cursor": args?.cursor } }, options);
        return out;
    }
    /** 结束选中授权及同一issuer旧访问令牌，不撤销其他issuer */
    async selfSecurityOidcRevoke(args, options) {
        const out = await executeOperation(this.cfg, OP_SELF_SECURITY_OIDC_REVOKE, { pathParams: { "id": args.id }, body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 本人 Passkey 清单 */
    async passkeysList(options) {
        const out = await executeOperation(this.cfg, OP_PASSKEYS_LIST, {}, options);
        return out;
    }
    /** Passkey 注册 options */
    async passkeysRegisterOptions(args, options) {
        const out = await executeOperation(this.cfg, OP_PASSKEYS_REGISTER_OPTIONS, { csrfToken: args.xCsrfToken, ...(args?.body === undefined ? {} : { body: args.body }), idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** Passkey 注册完成（命名+凭据落库） */
    async passkeysRegister(args, options) {
        const out = await executeOperation(this.cfg, OP_PASSKEYS_REGISTER, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** Passkey 改名 */
    async passkeyRename(args, options) {
        const out = await executeOperation(this.cfg, OP_PASSKEY_RENAME, { pathParams: { "credential_id": args.credentialId }, body: args.body }, options);
        return out;
    }
    /** Passkey 删除（最后一枚保护→须先启用 TOTP） */
    async passkeyDelete(args, options) {
        const out = await executeOperation(this.cfg, OP_PASSKEY_DELETE, { pathParams: { "credential_id": args.credentialId } }, options);
        return out;
    }
    /** 读取本人安全摘要，不返回认证机密 */
    async selfSecuritySummary(options) {
        const out = await executeOperation(this.cfg, OP_SELF_SECURITY_SUMMARY, {}, options);
        return out;
    }
    /** 会话列表（含 current 标记） */
    async portalSessions(options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_SESSIONS, {}, options);
        return out;
    }
    /** 吊销除当前外全部会话 */
    async portalSessionsRevokeOthers(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_SESSIONS_REVOKE_OTHERS, { ...(args?.body === undefined ? {} : { body: args.body }) }, options);
        return out;
    }
    /** 吊销指定会话 */
    async portalSessionRevoke(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_SESSION_REVOKE, { pathParams: { "session_id": args.sessionId } }, options);
        return out;
    }
    /** 本人可见站点清单（含默认站标记） */
    async portalSites(options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_SITES, {}, options);
        return out;
    }
    /** 设默认站点 */
    async portalSiteSetDefault(args, options) {
        const out = await executeOperation(this.cfg, OP_PORTAL_SITE_SET_DEFAULT, { pathParams: { "site_code": args.siteCode }, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** OP 就绪探针（DB 连通） */
    async opReadyz(options) {
        const out = await executeOperation(this.cfg, OP_OP_READYZ, {}, options);
        return out;
    }
    /** 旧社交入口导向同一受保护认证流程 */
    async legacySocialStart(args, options) {
        await executeOperation(this.cfg, OP_LEGACY_SOCIAL_START, { pathParams: { "provider": args.provider } }, options);
        return;
    }
    /** 旧社交入口导向同一受保护认证流程 */
    async legacySocialCallback(args, options) {
        await executeOperation(this.cfg, OP_LEGACY_SOCIAL_CALLBACK, { pathParams: { "provider": args.provider } }, options);
        return;
    }
    /** OIDC discovery（租户 issuer /t/{slug}） */
    async oidcTenantDiscovery(args, options) {
        const out = await executeOperation(this.cfg, OP_OIDC_TENANT_DISCOVERY, { pathParams: { "slug": args.slug } }, options);
        return out;
    }
    /** 授权端点（租户 issuer） */
    async oidcTenantAuthorize(args, options) {
        await executeOperation(this.cfg, OP_OIDC_TENANT_AUTHORIZE, { pathParams: { "slug": args.slug }, query: { "client_id": args.clientId, "redirect_uri": args.redirectUri, "response_type": args.responseType } }, options);
        return;
    }
    /** 设备授权（租户 issuer） */
    async oidcTenantDeviceAuthorization(args, options) {
        const out = await executeOperation(this.cfg, OP_OIDC_TENANT_DEVICE_AUTHORIZATION, { pathParams: { "slug": args.slug }, body: args.body }, options);
        return out;
    }
    /** JWKS（租户 issuer） */
    async oidcTenantJwks(args, options) {
        const out = await executeOperation(this.cfg, OP_OIDC_TENANT_JWKS, { pathParams: { "slug": args.slug } }, options);
        return out;
    }
    /** userinfo（租户 issuer；bearerAT） */
    async oidcTenantMe(args, options) {
        const out = await executeOperation(this.cfg, OP_OIDC_TENANT_ME, { pathParams: { "slug": args.slug } }, options);
        return out;
    }
    /** userinfo（POST 形态） */
    async oidcTenantMePost(args, options) {
        const out = await executeOperation(this.cfg, OP_OIDC_TENANT_ME_POST, { pathParams: { "slug": args.slug } }, options);
        return out;
    }
    /** 令牌端点（租户 issuer） */
    async oidcTenantToken(args, options) {
        const out = await executeOperation(this.cfg, OP_OIDC_TENANT_TOKEN, { pathParams: { "slug": args.slug }, body: args.body }, options);
        return out;
    }
    /** 令牌吊销（租户 issuer） */
    async oidcTenantTokenRevocation(args, options) {
        await executeOperation(this.cfg, OP_OIDC_TENANT_TOKEN_REVOCATION, { pathParams: { "slug": args.slug }, body: args.body }, options);
        return;
    }
    /** 令牌端点（authorization_code/refresh_token/device_code；Basic 或 post 密钥） */
    async oidcToken(args, options) {
        const out = await executeOperation(this.cfg, OP_OIDC_TOKEN, { body: args.body }, options);
        return out;
    }
    /** 令牌吊销（RFC7009） */
    async oidcTokenRevocation(args, options) {
        await executeOperation(this.cfg, OP_OIDC_TOKEN_REVOCATION, { body: args.body }, options);
        return;
    }
    /** 受控调账（禁止自动调平/直改余额；审批+审计。direction=credit 走 admin_adjustment 入账；direction=debit 走 admin_debit 内核——available 先扣不透支、缺口记 overdraft_receivable 应收并隔离 quarantined、额度回销 sys:liability:issuance） */
    async walletAdjust(args, options) {
        const out = await executeOperation(this.cfg, OP_WALLET_ADJUST, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 查询钱包余额（lookup不改变资金） */
    async walletBalance(args, options) {
        const out = await executeOperation(this.cfg, OP_WALLET_BALANCE, { query: { "user_id": args.userId, "site_code": args.siteCode } }, options);
        return out;
    }
    /** 拒付强制扣减（platform_admin scope；available 先扣、缺口记应收并隔离） */
    async walletChargebackSubmit(args, options) {
        const out = await executeOperation(this.cfg, OP_WALLET_CHARGEBACK_SUBMIT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 累计续占（target_total_units累计目标；零差额有持久结果；固定费一次） */
    async walletExtend(args, options) {
        const out = await executeOperation(this.cfg, OP_WALLET_EXTEND, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 账本差异核查（AC-MON-24：accounts 余额合计 vs journal 腿合计；逐户差异 top-N + 应收明细；差异为真值才报、差异=0 为空集） */
    async walletReconciliationDifferences(args, options) {
        const out = await executeOperation(this.cfg, OP_WALLET_RECONCILIATION_DIFFERENCES, { query: { "limit": args?.limit } }, options);
        return out;
    }
    /** 退款（按原入账 journal 反向过账；支持部分退，累计不超原入账贷方合计） */
    async walletRefundSubmit(args, options) {
        const out = await executeOperation(this.cfg, OP_WALLET_REFUND_SUBMIT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 释放预占（仅在证明未派发/未执行时） */
    async walletRelease(args, options) {
        const out = await executeOperation(this.cfg, OP_WALLET_RELEASE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 查询预占（只读） */
    async walletReservationLookup(args, options) {
        const out = await executeOperation(this.cfg, OP_WALLET_RESERVATION_LOOKUP, { pathParams: { "reservationId": args.reservationId } }, options);
        return out;
    }
    /** 预占（确定价格快照与执行上限；锁账户授权→held） */
    async walletReserve(args, options) {
        const out = await executeOperation(this.cfg, OP_WALLET_RESERVE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 错误过账整单冲正（platform_admin scope；原腿符号翻转；同一原单仅一次） */
    async walletReverseSubmit(args, options) {
        const out = await executeOperation(this.cfg, OP_WALLET_REVERSE_SUBMIT, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
    /** 结算（授权上限内返还未用；用量未知不自动退；成本可后补） */
    async walletSettle(args, options) {
        const out = await executeOperation(this.cfg, OP_WALLET_SETTLE, { body: args.body, idempotencyKey: args.idempotencyKey }, options);
        return out;
    }
}
