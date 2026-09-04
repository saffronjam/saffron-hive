/**
* | output |
* | --- |
* | "Advanced" |
*
* @param {Activity_AdvancedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_advanced: ((inputs?: Activity_AdvancedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_AdvancedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automation fired: {name}" |
*
* @param {Activity_Automation_FiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_automation_fired: ((inputs: Activity_Automation_FiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Automation_FiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automation fired" |
*
* @param {Activity_Automation_Fired_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_automation_fired_generic: ((inputs?: Activity_Automation_Fired_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Automation_Fired_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automation {id}" |
*
* @param {Activity_Automation_IdInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_automation_id: ((inputs: Activity_Automation_IdInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Automation_IdInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Command sent to {name}" |
*
* @param {Activity_Command_SentInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_command_sent: ((inputs: Activity_Command_SentInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Command_SentInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name}: {action}" |
*
* @param {Activity_Device_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_device_action: ((inputs: Activity_Device_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Device_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} action" |
*
* @param {Activity_Device_Action_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_device_action_generic: ((inputs: Activity_Device_Action_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Device_Action_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "New device discovered: {name}" |
*
* @param {Activity_Device_AddedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_device_added: ((inputs: Activity_Device_AddedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Device_AddedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "New device discovered" |
*
* @param {Activity_Device_Added_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_device_added_generic: ((inputs?: Activity_Device_Added_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Device_Added_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} went offline" |
*
* @param {Activity_Device_OfflineInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_device_offline: ((inputs: Activity_Device_OfflineInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Device_OfflineInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} came online" |
*
* @param {Activity_Device_OnlineInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_device_online: ((inputs: Activity_Device_OnlineInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Device_OnlineInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device removed: {name}" |
*
* @param {Activity_Device_RemovedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_device_removed: ((inputs: Activity_Device_RemovedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Device_RemovedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device removed" |
*
* @param {Activity_Device_Removed_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_device_removed_generic: ((inputs?: Activity_Device_Removed_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Device_Removed_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} state changed" |
*
* @param {Activity_Device_State_ChangedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_device_state_changed: ((inputs: Activity_Device_State_ChangedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Device_State_ChangedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No activity yet." |
*
* @param {Activity_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_empty: ((inputs?: Activity_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device state changes, scene activations, and automation runs will appear here as they happen." |
*
* @param {Activity_Empty_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_empty_help: ((inputs?: Activity_Empty_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Empty_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automation fired" |
*
* @param {Activity_Event_Automation_FiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_event_automation_fired: ((inputs?: Activity_Event_Automation_FiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Event_Automation_FiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Availability" |
*
* @param {Activity_Event_AvailabilityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_event_availability: ((inputs?: Activity_Event_AvailabilityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Event_AvailabilityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Command sent" |
*
* @param {Activity_Event_Command_SentInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_event_command_sent: ((inputs?: Activity_Event_Command_SentInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Event_Command_SentInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device added" |
*
* @param {Activity_Event_Device_AddedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_event_device_added: ((inputs?: Activity_Event_Device_AddedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Event_Device_AddedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device removed" |
*
* @param {Activity_Event_Device_RemovedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_event_device_removed: ((inputs?: Activity_Event_Device_RemovedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Event_Device_RemovedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Node activated" |
*
* @param {Activity_Event_Node_ActivatedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_event_node_activated: ((inputs?: Activity_Event_Node_ActivatedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Event_Node_ActivatedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scene applied" |
*
* @param {Activity_Event_Scene_AppliedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_event_scene_applied: ((inputs?: Activity_Event_Scene_AppliedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Event_Scene_AppliedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "State changed" |
*
* @param {Activity_Event_State_ChangedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_event_state_changed: ((inputs?: Activity_Event_State_ChangedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Event_State_ChangedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhook received" |
*
* @param {Activity_Event_Webhook_ReceivedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_event_webhook_received: ((inputs?: Activity_Event_Webhook_ReceivedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Event_Webhook_ReceivedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device" |
*
* @param {Activity_Filter_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_filter_device: ((inputs?: Activity_Filter_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Filter_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Room" |
*
* @param {Activity_Filter_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_filter_room: ((inputs?: Activity_Filter_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Filter_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Since" |
*
* @param {Activity_Filter_SinceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_filter_since: ((inputs?: Activity_Filter_SinceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Filter_SinceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Type" |
*
* @param {Activity_Filter_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_filter_type: ((inputs?: Activity_Filter_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Filter_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automation" |
*
* @param {Activity_Generic_AutomationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_generic_automation: ((inputs?: Activity_Generic_AutomationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Generic_AutomationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device" |
*
* @param {Activity_Generic_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_generic_device: ((inputs?: Activity_Generic_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Generic_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Message" |
*
* @param {Activity_MessageInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_message: ((inputs?: Activity_MessageInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_MessageInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No activity matches your filters." |
*
* @param {Activity_No_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_no_match: ((inputs?: Activity_No_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_No_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name}: node activated" |
*
* @param {Activity_Node_ActivatedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_node_activated: ((inputs: Activity_Node_ActivatedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Node_ActivatedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name}: node deactivated" |
*
* @param {Activity_Node_DeactivatedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_node_deactivated: ((inputs: Activity_Node_DeactivatedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Node_DeactivatedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Payload" |
*
* @param {Activity_PayloadInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_payload: ((inputs?: Activity_PayloadInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_PayloadInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Recent activity" |
*
* @param {Activity_RecentInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_recent: ((inputs?: Activity_RecentInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_RecentInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No recent automation activity." |
*
* @param {Activity_Recent_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_recent_empty: ((inputs?: Activity_Recent_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Recent_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scene applied: {name}" |
*
* @param {Activity_Scene_AppliedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_scene_applied: ((inputs: Activity_Scene_AppliedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Scene_AppliedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scene applied" |
*
* @param {Activity_Scene_Applied_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_scene_applied_generic: ((inputs?: Activity_Scene_Applied_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Scene_Applied_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search activity…" |
*
* @param {Activity_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_search: ((inputs?: Activity_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select activity {message}" |
*
* @param {Activity_SelectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_select: ((inputs: Activity_SelectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_SelectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last {count} days" |
*
* @param {Activity_Since_DaysInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_since_days: ((inputs: Activity_Since_DaysInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Since_DaysInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last hour" |
*
* @param {Activity_Since_HourInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_since_hour: ((inputs?: Activity_Since_HourInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Since_HourInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last {count} hours" |
*
* @param {Activity_Since_HoursInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_since_hours: ((inputs: Activity_Since_HoursInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Since_HoursInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last {count} minutes" |
*
* @param {Activity_Since_MinutesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_since_minutes: ((inputs: Activity_Since_MinutesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Since_MinutesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Time" |
*
* @param {Activity_TimeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_time: ((inputs?: Activity_TimeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_TimeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Action" |
*
* @param {Activity_Type_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_type_action: ((inputs?: Activity_Type_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Type_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Added" |
*
* @param {Activity_Type_AddedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_type_added: ((inputs?: Activity_Type_AddedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Type_AddedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automation" |
*
* @param {Activity_Type_AutomationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_type_automation: ((inputs?: Activity_Type_AutomationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Type_AutomationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Availability" |
*
* @param {Activity_Type_AvailabilityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_type_availability: ((inputs?: Activity_Type_AvailabilityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Type_AvailabilityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Command" |
*
* @param {Activity_Type_CommandInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_type_command: ((inputs?: Activity_Type_CommandInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Type_CommandInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Node" |
*
* @param {Activity_Type_NodeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_type_node: ((inputs?: Activity_Type_NodeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Type_NodeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Removed" |
*
* @param {Activity_Type_RemovedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_type_removed: ((inputs?: Activity_Type_RemovedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Type_RemovedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scene" |
*
* @param {Activity_Type_SceneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_type_scene: ((inputs?: Activity_Type_SceneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Type_SceneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "State" |
*
* @param {Activity_Type_StateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_type_state: ((inputs?: Activity_Type_StateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Type_StateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhook" |
*
* @param {Activity_Type_WebhookInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_type_webhook: ((inputs?: Activity_Type_WebhookInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Type_WebhookInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Activity event" |
*
* @param {Activity_UnknownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_unknown: ((inputs?: Activity_UnknownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_UnknownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhook received: {name}" |
*
* @param {Activity_Webhook_ReceivedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_webhook_received: ((inputs: Activity_Webhook_ReceivedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Webhook_ReceivedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhook received" |
*
* @param {Activity_Webhook_Received_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const activity_webhook_received_generic: ((inputs?: Activity_Webhook_Received_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Activity_Webhook_Received_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device “{name}” battery is {value}%" |
*
* @param {Alarm_Battery_LowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarm_battery_low: ((inputs: Alarm_Battery_LowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarm_Battery_LowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Zigbee2MQTT broker is disconnected" |
*
* @param {Alarm_Broker_DisconnectedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarm_broker_disconnected: ((inputs?: Alarm_Broker_DisconnectedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarm_Broker_DisconnectedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device “{name}” has not reported recently" |
*
* @param {Alarm_Device_UnavailableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarm_device_unavailable: ((inputs: Alarm_Device_UnavailableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarm_Device_UnavailableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Disk free space is {value}%, below the {threshold}% threshold" |
*
* @param {Alarm_Disk_LowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarm_disk_low: ((inputs: Alarm_Disk_LowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarm_Disk_LowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Go heap allocation is {value} MiB, above the {threshold} MiB threshold" |
*
* @param {Alarm_Memory_HighInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarm_memory_high: ((inputs: Alarm_Memory_HighInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarm_Memory_HighInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Multiple alarms were just raised." |
*
* @param {Alarm_Multiple_RaisedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarm_multiple_raised: ((inputs?: Alarm_Multiple_RaisedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarm_Multiple_RaisedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} new alarm" |
* | * | "{count} new alarms" |
*
* @param {Alarm_New_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarm_new_count: ((inputs: Alarm_New_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarm_New_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Alarm: {id}" |
*
* @param {Alarm_Toast_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarm_toast_description: ((inputs: Alarm_Toast_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarm_Toast_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "System alarm" |
*
* @param {Alarm_Unknown_SystemInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarm_unknown_system: ((inputs?: Alarm_Unknown_SystemInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarm_Unknown_SystemInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Count" |
*
* @param {Alarms_Column_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_column_count: ((inputs?: Alarms_Column_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Column_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last raised" |
*
* @param {Alarms_Column_Last_RaisedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_column_last_raised: ((inputs?: Alarms_Column_Last_RaisedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Column_Last_RaisedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Message" |
*
* @param {Alarms_Column_MessageInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_column_message: ((inputs?: Alarms_Column_MessageInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Column_MessageInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete alarm" |
*
* @param {Alarms_Delete_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_delete_aria: ((inputs?: Alarms_Delete_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Delete_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This alarm normally clears itself when the underlying condition resolves. Deleting it manually may hide an ongoing issue." |
*
* @param {Alarms_Delete_Auto_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_delete_auto_description: ((inputs?: Alarms_Delete_Auto_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Delete_Auto_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Are you sure you want to delete this alarm?" |
*
* @param {Alarms_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_delete_description: ((inputs?: Alarms_Delete_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Delete_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This permanently clears the selected alarms. Auto alarms that are still actively being raised will reappear." |
*
* @param {Alarms_Delete_Many_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_delete_many_description: ((inputs?: Alarms_Delete_Many_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Delete_Many_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Delete {count} alarm?" |
* | * | "Delete {count} alarms?" |
*
* @param {Alarms_Delete_Many_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_delete_many_title: ((inputs: Alarms_Delete_Many_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Delete_Many_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete alarm" |
*
* @param {Alarms_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_delete_title: ((inputs?: Alarms_Delete_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Delete_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No active alarms — the system looks healthy." |
*
* @param {Alarms_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_empty: ((inputs?: Alarms_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Alarms raised by the system monitor or your automations will appear here." |
*
* @param {Alarms_Empty_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_empty_help: ((inputs?: Alarms_Empty_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Empty_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Kind" |
*
* @param {Alarms_Filter_KindInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_filter_kind: ((inputs?: Alarms_Filter_KindInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Filter_KindInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Severity" |
*
* @param {Alarms_Filter_SeverityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_filter_severity: ((inputs?: Alarms_Filter_SeverityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Filter_SeverityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Since" |
*
* @param {Alarms_Filter_SinceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_filter_since: ((inputs?: Alarms_Filter_SinceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Filter_SinceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Source" |
*
* @param {Alarms_Filter_SourceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_filter_source: ((inputs?: Alarms_Filter_SourceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Filter_SourceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Auto" |
*
* @param {Alarms_Kind_AutoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_kind_auto: ((inputs?: Alarms_Kind_AutoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Kind_AutoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "One-shot" |
*
* @param {Alarms_Kind_One_ShotInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_kind_one_shot: ((inputs?: Alarms_Kind_One_ShotInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Kind_One_ShotInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No alarms match your filters." |
*
* @param {Alarms_No_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_no_match: ((inputs?: Alarms_No_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_No_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search alarms…" |
*
* @param {Alarms_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_search: ((inputs?: Alarms_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select alarm {id}" |
*
* @param {Alarms_SelectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_select: ((inputs: Alarms_SelectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_SelectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{severity} severity" |
*
* @param {Alarms_Severity_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_severity_aria: ((inputs: Alarms_Severity_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Severity_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "High" |
*
* @param {Alarms_Severity_HighInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_severity_high: ((inputs?: Alarms_Severity_HighInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Severity_HighInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Low" |
*
* @param {Alarms_Severity_LowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_severity_low: ((inputs?: Alarms_Severity_LowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Severity_LowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Medium" |
*
* @param {Alarms_Severity_MediumInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_severity_medium: ((inputs?: Alarms_Severity_MediumInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_Severity_MediumInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Alarms" |
*
* @param {Alarms_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const alarms_title: ((inputs?: Alarms_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Alarms_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Printed to the server logs on first boot, or read {path} on the host." |
*
* @param {Auth_Bootstrap_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_bootstrap_help: ((inputs: Auth_Bootstrap_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Bootstrap_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Bootstrap token" |
*
* @param {Auth_Bootstrap_TokenInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_bootstrap_token: ((inputs?: Auth_Bootstrap_TokenInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Bootstrap_TokenInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose a password before continuing." |
*
* @param {Auth_Choose_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_choose_password: ((inputs?: Auth_Choose_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Choose_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Confirm new password" |
*
* @param {Auth_Confirm_New_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_confirm_new_password: ((inputs?: Auth_Confirm_New_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Confirm_New_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Confirm password" |
*
* @param {Auth_Confirm_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_confirm_password: ((inputs?: Auth_Confirm_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Confirm_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create user" |
*
* @param {Auth_Create_UserInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_create_user: ((inputs?: Auth_Create_UserInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Create_UserInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Failed to create user." |
*
* @param {Auth_Create_User_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_create_user_failed: ((inputs?: Auth_Create_User_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Create_User_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sign-in failed. Check your username and password." |
*
* @param {Auth_Login_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_login_failed: ((inputs?: Auth_Login_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Login_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Auth_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_name: ((inputs?: Auth_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "New password" |
*
* @param {Auth_New_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_new_password: ((inputs?: Auth_New_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_New_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Password" |
*
* @param {Auth_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_password: ((inputs?: Auth_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Password must include uppercase, lowercase, and a digit." |
*
* @param {Auth_Password_ComplexityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_password_complexity: ((inputs?: Auth_Password_ComplexityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Password_ComplexityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Password must be at least {count} characters." |
*
* @param {Auth_Password_MinimumInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_password_minimum: ((inputs: Auth_Password_MinimumInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Password_MinimumInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Password set" |
*
* @param {Auth_Password_SetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_password_set: ((inputs?: Auth_Password_SetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Password_SetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Passwords do not match." |
*
* @param {Auth_Passwords_MismatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_passwords_mismatch: ((inputs?: Auth_Passwords_MismatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Passwords_MismatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set a new password" |
*
* @param {Auth_Set_A_New_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_set_a_new_password: ((inputs?: Auth_Set_A_New_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Set_A_New_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set new password" |
*
* @param {Auth_Set_New_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_set_new_password: ((inputs?: Auth_Set_New_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Set_New_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set password" |
*
* @param {Auth_Set_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_set_password: ((inputs?: Auth_Set_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Set_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not set password." |
*
* @param {Auth_Set_Password_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_set_password_failed: ((inputs?: Auth_Set_Password_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Set_Password_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Setup" |
*
* @param {Auth_SetupInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_setup: ((inputs?: Auth_SetupInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_SetupInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create the first user. This will be your admin account." |
*
* @param {Auth_Setup_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_setup_description: ((inputs?: Auth_Setup_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Setup_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Welcome to Hive!" |
*
* @param {Auth_Setup_WelcomeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_setup_welcome: ((inputs?: Auth_Setup_WelcomeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Setup_WelcomeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sign in" |
*
* @param {Auth_Sign_InInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_sign_in: ((inputs?: Auth_Sign_InInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Sign_InInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sign in" |
*
* @param {Auth_Sign_In_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_sign_in_title: ((inputs?: Auth_Sign_In_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Sign_In_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Username" |
*
* @param {Auth_UsernameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_username: ((inputs?: Auth_UsernameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_UsernameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Welcome, {name}. Choose a password before continuing." |
*
* @param {Auth_Welcome_Choose_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const auth_welcome_choose_password: ((inputs: Auth_Welcome_Choose_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Auth_Welcome_Choose_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Activate scene" |
*
* @param {Automation_Action_Activate_SceneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_activate_scene: ((inputs?: Automation_Action_Activate_SceneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Activate_SceneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Activates a scene" |
*
* @param {Automation_Action_Activate_Scene_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_activate_scene_description: ((inputs?: Automation_Action_Activate_Scene_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Activate_Scene_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Change value" |
*
* @param {Automation_Action_Change_ValueInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_change_value: ((inputs?: Automation_Action_Change_ValueInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Change_ValueInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Adjusts a numeric value by an amount" |
*
* @param {Automation_Action_Change_Value_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_change_value_description: ((inputs?: Automation_Action_Change_Value_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Change_Value_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear alarm" |
*
* @param {Automation_Action_Clear_AlarmInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_clear_alarm: ((inputs?: Automation_Action_Clear_AlarmInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Clear_AlarmInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clears a matching alarm" |
*
* @param {Automation_Action_Clear_Alarm_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_clear_alarm_description: ((inputs?: Automation_Action_Clear_Alarm_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Clear_Alarm_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Configure device" |
*
* @param {Automation_Action_Configure_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_configure_device: ((inputs?: Automation_Action_Configure_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Configure_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Changes persistent device settings" |
*
* @param {Automation_Action_Configure_Device_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_configure_device_description: ((inputs?: Automation_Action_Configure_Device_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Configure_Device_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scene cycle" |
*
* @param {Automation_Action_Cycle_ScenesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_cycle_scenes: ((inputs?: Automation_Action_Cycle_ScenesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Cycle_ScenesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Advances through an ordered scene list" |
*
* @param {Automation_Action_Cycle_Scenes_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_cycle_scenes_description: ((inputs?: Automation_Action_Cycle_Scenes_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Cycle_Scenes_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Raise alarm" |
*
* @param {Automation_Action_Raise_AlarmInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_raise_alarm: ((inputs?: Automation_Action_Raise_AlarmInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Raise_AlarmInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Creates or updates an alarm" |
*
* @param {Automation_Action_Raise_Alarm_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_raise_alarm_description: ((inputs?: Automation_Action_Raise_Alarm_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Raise_Alarm_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Run effect" |
*
* @param {Automation_Action_Run_EffectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_run_effect: ((inputs?: Automation_Action_Run_EffectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Run_EffectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Starts an effect on matching devices" |
*
* @param {Automation_Action_Run_Effect_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_run_effect_description: ((inputs?: Automation_Action_Run_Effect_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Run_Effect_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set state" |
*
* @param {Automation_Action_Set_StateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_set_state: ((inputs?: Automation_Action_Set_StateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Set_StateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sets one or more device state values" |
*
* @param {Automation_Action_Set_State_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_set_state_description: ((inputs?: Automation_Action_Set_State_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Set_State_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Toggle state" |
*
* @param {Automation_Action_Toggle_StateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_toggle_state: ((inputs?: Automation_Action_Toggle_StateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Toggle_StateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Toggles power for a device, group, or room" |
*
* @param {Automation_Action_Toggle_State_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_action_toggle_state_description: ((inputs?: Automation_Action_Toggle_State_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Action_Toggle_State_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delta" |
*
* @param {Automation_Change_DeltaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_change_delta: ((inputs?: Automation_Change_DeltaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Change_DeltaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Target has no adjustable numeric fields." |
*
* @param {Automation_Change_No_FieldsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_change_no_fields: ((inputs?: Automation_Change_No_FieldsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Change_No_FieldsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Range: {minimum} – {maximum}" |
*
* @param {Automation_Change_RangeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_change_range: ((inputs: Automation_Change_RangeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Change_RangeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select field" |
*
* @param {Automation_Change_Select_FieldInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_change_select_field: ((inputs?: Automation_Change_Select_FieldInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Change_Select_FieldInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Value" |
*
* @param {Automation_Change_ValueInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_change_value: ((inputs?: Automation_Change_ValueInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Change_ValueInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Custom" |
*
* @param {Automation_Condition_CustomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_condition_custom: ((inputs?: Automation_Condition_CustomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Condition_CustomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Checks a custom boolean expression" |
*
* @param {Automation_Condition_Custom_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_condition_custom_description: ((inputs?: Automation_Condition_Custom_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Condition_Custom_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device state" |
*
* @param {Automation_Condition_Device_StateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_condition_device_state: ((inputs?: Automation_Condition_Device_StateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Condition_Device_StateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Checks the current state of a device, group, or room" |
*
* @param {Automation_Condition_Device_State_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_condition_device_state_description: ((inputs?: Automation_Condition_Device_State_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Condition_Device_State_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Time window" |
*
* @param {Automation_Condition_Time_WindowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_condition_time_window: ((inputs?: Automation_Condition_Time_WindowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Condition_Time_WindowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Passes during a configured time range" |
*
* @param {Automation_Condition_Time_Window_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_condition_time_window_description: ((inputs?: Automation_Condition_Time_Window_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Condition_Time_Window_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Weekday" |
*
* @param {Automation_Condition_WeekdayInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_condition_weekday: ((inputs?: Automation_Condition_WeekdayInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Condition_WeekdayInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Passes on selected days" |
*
* @param {Automation_Condition_Weekday_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_condition_weekday_description: ((inputs?: Automation_Condition_Weekday_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Condition_Weekday_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add node" |
*
* @param {Automation_Editor_Add_NodeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_add_node: ((inputs?: Automation_Editor_Add_NodeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Add_NodeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Auto" |
*
* @param {Automation_Editor_AutoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_auto: ((inputs?: Automation_Editor_AutoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_AutoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Change icon" |
*
* @param {Automation_Editor_Change_IconInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_change_icon: ((inputs?: Automation_Editor_Change_IconInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Change_IconInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Code" |
*
* @param {Automation_Editor_CodeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_code: ((inputs?: Automation_Editor_CodeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_CodeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Copy selected nodes" |
*
* @param {Automation_Editor_Copy_NodesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_copy_nodes: ((inputs?: Automation_Editor_Copy_NodesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Copy_NodesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Copy trigger condition" |
*
* @param {Automation_Editor_Copy_Trigger_ConditionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_copy_trigger_condition: ((inputs?: Automation_Editor_Copy_Trigger_ConditionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Copy_Trigger_ConditionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Are you sure you want to delete “{name}”? This action cannot be undone." |
*
* @param {Automation_Editor_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_delete_description: ((inputs: Automation_Editor_Delete_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Delete_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the automation." |
*
* @param {Automation_Editor_Delete_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_delete_failed: ((inputs?: Automation_Editor_Delete_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Delete_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete automation" |
*
* @param {Automation_Editor_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_delete_title: ((inputs?: Automation_Editor_Delete_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Delete_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Automation_Editor_EditInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_edit: ((inputs?: Automation_Editor_EditInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_EditInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automation" |
*
* @param {Automation_Editor_FallbackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_fallback: ((inputs?: Automation_Editor_FallbackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_FallbackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not fire the trigger." |
*
* @param {Automation_Editor_Fire_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_fire_failed: ((inputs?: Automation_Editor_Fire_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Fire_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Free" |
*
* @param {Automation_Editor_FreeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_free: ((inputs?: Automation_Editor_FreeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_FreeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automation graph" |
*
* @param {Automation_Editor_Graph_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_graph_aria: ((inputs?: Automation_Editor_Graph_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Graph_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Invalid config:" |
*
* @param {Automation_Editor_Invalid_ConfigInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_invalid_config: ((inputs?: Automation_Editor_Invalid_ConfigInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Invalid_ConfigInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Live" |
*
* @param {Automation_Editor_LiveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_live: ((inputs?: Automation_Editor_LiveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_LiveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Lock" |
*
* @param {Automation_Editor_LockInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_lock: ((inputs?: Automation_Editor_LockInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_LockInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automation name" |
*
* @param {Automation_Editor_Name_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_name_placeholder: ((inputs?: Automation_Editor_Name_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Name_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Paste nodes" |
*
* @param {Automation_Editor_PasteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_paste: ((inputs?: Automation_Editor_PasteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_PasteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Paste copied nodes" |
*
* @param {Automation_Editor_Paste_NodesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_paste_nodes: ((inputs?: Automation_Editor_Paste_NodesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Paste_NodesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save the automation." |
*
* @param {Automation_Editor_Save_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_save_failed: ((inputs?: Automation_Editor_Save_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_Save_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sort" |
*
* @param {Automation_Editor_SortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_sort: ((inputs?: Automation_Editor_SortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_SortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unlock" |
*
* @param {Automation_Editor_UnlockInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_unlock: ((inputs?: Automation_Editor_UnlockInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_UnlockInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Visual" |
*
* @param {Automation_Editor_VisualInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_editor_visual: ((inputs?: Automation_Editor_VisualInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Editor_VisualInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Action" |
*
* @param {Automation_Node_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_action: ((inputs?: Automation_Node_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add scene" |
*
* @param {Automation_Node_Add_SceneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_add_scene: ((inputs?: Automation_Node_Add_SceneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Add_SceneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Advanced" |
*
* @param {Automation_Node_AdvancedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_advanced: ((inputs?: Automation_Node_AdvancedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_AdvancedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "After" |
*
* @param {Automation_Node_AfterInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_after: ((inputs?: Automation_Node_AfterInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_AfterInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "After hour" |
*
* @param {Automation_Node_After_HourInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_after_hour: ((inputs?: Automation_Node_After_HourInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_After_HourInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "After minute" |
*
* @param {Automation_Node_After_MinuteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_after_minute: ((inputs?: Automation_Node_After_MinuteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_After_MinuteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Auto" |
*
* @param {Automation_Node_Alarm_AutoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_alarm_auto: ((inputs?: Automation_Node_Alarm_AutoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Alarm_AutoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Alarm ID to clear" |
*
* @param {Automation_Node_Alarm_Id_Clear_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_alarm_id_clear_placeholder: ((inputs?: Automation_Node_Alarm_Id_Clear_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Alarm_Id_Clear_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Alarm ID (e.g. humidity.high)" |
*
* @param {Automation_Node_Alarm_Id_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_alarm_id_placeholder: ((inputs?: Automation_Node_Alarm_Id_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Alarm_Id_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Message displayed on the alarms page" |
*
* @param {Automation_Node_Alarm_Message_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_alarm_message_placeholder: ((inputs?: Automation_Node_Alarm_Message_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Alarm_Message_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "One-shot" |
*
* @param {Automation_Node_Alarm_One_ShotInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_alarm_one_shot: ((inputs?: Automation_Node_Alarm_One_ShotInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Alarm_One_ShotInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Before" |
*
* @param {Automation_Node_BeforeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_before: ((inputs?: Automation_Node_BeforeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_BeforeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Before hour" |
*
* @param {Automation_Node_Before_HourInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_before_hour: ((inputs?: Automation_Node_Before_HourInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Before_HourInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Before minute" |
*
* @param {Automation_Node_Before_MinuteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_before_minute: ((inputs?: Automation_Node_Before_MinuteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Before_MinuteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Condition" |
*
* @param {Automation_Node_ConditionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_condition: ((inputs?: Automation_Node_ConditionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_ConditionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Condition expression" |
*
* @param {Automation_Node_Condition_ExpressionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_condition_expression: ((inputs?: Automation_Node_Condition_ExpressionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Condition_ExpressionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cooldown" |
*
* @param {Automation_Node_CooldownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_cooldown: ((inputs?: Automation_Node_CooldownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_CooldownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About trigger cooldown" |
*
* @param {Automation_Node_Cooldown_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_cooldown_about: ((inputs?: Automation_Node_Cooldown_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Cooldown_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Suppress matching events inside this window." |
*
* @param {Automation_Node_Cooldown_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_cooldown_help: ((inputs?: Automation_Node_Cooldown_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Cooldown_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "C: {duration}" |
*
* @param {Automation_Node_Cooldown_ShortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_cooldown_short: ((inputs: Automation_Node_Cooldown_ShortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Cooldown_ShortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "* * * * * * (sec min hr dom mon dow)" |
*
* @param {Automation_Node_Cron_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_cron_placeholder: ((inputs?: Automation_Node_Cron_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Cron_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Expression, e.g. time.hour >= 21" |
*
* @param {Automation_Node_Custom_Expression_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_custom_expression_placeholder: ((inputs?: Automation_Node_Custom_Expression_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Custom_Expression_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Deleted scene ({id})" |
*
* @param {Automation_Node_Deleted_SceneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_deleted_scene: ((inputs: Automation_Node_Deleted_SceneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Deleted_SceneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Availability" |
*
* @param {Automation_Node_Event_AvailabilityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_event_availability: ((inputs?: Automation_Node_Event_AvailabilityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Event_AvailabilityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device added" |
*
* @param {Automation_Node_Event_Device_AddedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_event_device_added: ((inputs?: Automation_Node_Event_Device_AddedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Event_Device_AddedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device removed" |
*
* @param {Automation_Node_Event_Device_RemovedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_event_device_removed: ((inputs?: Automation_Node_Event_Device_RemovedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Event_Device_RemovedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "State changed" |
*
* @param {Automation_Node_Event_State_ChangedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_event_state_changed: ((inputs?: Automation_Node_Event_State_ChangedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Event_State_ChangedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Event value (e.g. single)" |
*
* @param {Automation_Node_Event_Value_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_event_value_placeholder: ((inputs?: Automation_Node_Event_Value_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Event_Value_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Type" |
*
* @param {Automation_Node_Filter_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_filter_type: ((inputs?: Automation_Node_Filter_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Filter_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Grace" |
*
* @param {Automation_Node_GraceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_grace: ((inputs?: Automation_Node_GraceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_GraceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About trigger grace" |
*
* @param {Automation_Node_Grace_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_grace_about: ((inputs?: Automation_Node_Grace_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Grace_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Keep this trigger active so AND/OR can combine it with later events." |
*
* @param {Automation_Node_Grace_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_grace_help: ((inputs?: Automation_Node_Grace_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Grace_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "G: {duration}" |
*
* @param {Automation_Node_Grace_ShortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_grace_short: ((inputs: Automation_Node_Grace_ShortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Grace_ShortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "hours" |
*
* @param {Automation_Node_HoursInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_hours: ((inputs?: Automation_Node_HoursInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_HoursInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Kind" |
*
* @param {Automation_Node_KindInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_kind: ((inputs?: Automation_Node_KindInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_KindInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "minutes" |
*
* @param {Automation_Node_MinutesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_minutes: ((inputs?: Automation_Node_MinutesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_MinutesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Missing scenes" |
*
* @param {Automation_Node_Missing_ScenesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_missing_scenes: ((inputs?: Automation_Node_Missing_ScenesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Missing_ScenesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Move down" |
*
* @param {Automation_Node_Move_DownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_move_down: ((inputs?: Automation_Node_Move_DownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Move_DownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Move up" |
*
* @param {Automation_Node_Move_UpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_move_up: ((inputs?: Automation_Node_Move_UpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Move_UpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No scenes available — create scenes first." |
*
* @param {Automation_Node_No_ScenesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_no_scenes: ((inputs?: Automation_Node_No_ScenesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_No_ScenesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a device to configure." |
*
* @param {Automation_Node_Pick_Device_ConfigureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_pick_device_configure: ((inputs?: Automation_Node_Pick_Device_ConfigureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Pick_Device_ConfigureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Removed" |
*
* @param {Automation_Node_RemovedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_removed: ((inputs?: Automation_Node_RemovedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_RemovedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "At time" |
*
* @param {Automation_Node_Schedule_AtInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_schedule_at: ((inputs?: Automation_Node_Schedule_AtInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Schedule_AtInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Custom cron" |
*
* @param {Automation_Node_Schedule_CustomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_schedule_custom: ((inputs?: Automation_Node_Schedule_CustomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Schedule_CustomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Every" |
*
* @param {Automation_Node_Schedule_EveryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_schedule_every: ((inputs?: Automation_Node_Schedule_EveryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Schedule_EveryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Schedule hour" |
*
* @param {Automation_Node_Schedule_HourInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_schedule_hour: ((inputs?: Automation_Node_Schedule_HourInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Schedule_HourInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Schedule interval" |
*
* @param {Automation_Node_Schedule_IntervalInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_schedule_interval: ((inputs?: Automation_Node_Schedule_IntervalInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Schedule_IntervalInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Schedule minute" |
*
* @param {Automation_Node_Schedule_MinuteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_schedule_minute: ((inputs?: Automation_Node_Schedule_MinuteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Schedule_MinuteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Schedule second" |
*
* @param {Automation_Node_Schedule_SecondInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_schedule_second: ((inputs?: Automation_Node_Schedule_SecondInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Schedule_SecondInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "seconds" |
*
* @param {Automation_Node_SecondsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_seconds: ((inputs?: Automation_Node_SecondsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_SecondsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select action" |
*
* @param {Automation_Node_Select_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_select_action: ((inputs?: Automation_Node_Select_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Select_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select condition" |
*
* @param {Automation_Node_Select_ConditionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_select_condition: ((inputs?: Automation_Node_Select_ConditionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Select_ConditionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select device" |
*
* @param {Automation_Node_Select_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_select_device: ((inputs?: Automation_Node_Select_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Select_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select effect" |
*
* @param {Automation_Node_Select_EffectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_select_effect: ((inputs?: Automation_Node_Select_EffectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Select_EffectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select event" |
*
* @param {Automation_Node_Select_EventInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_select_event: ((inputs?: Automation_Node_Select_EventInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Select_EventInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select property" |
*
* @param {Automation_Node_Select_PropertyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_select_property: ((inputs?: Automation_Node_Select_PropertyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Select_PropertyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select scene" |
*
* @param {Automation_Node_Select_SceneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_select_scene: ((inputs?: Automation_Node_Select_SceneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Select_SceneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select target" |
*
* @param {Automation_Node_Select_TargetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_select_target: ((inputs?: Automation_Node_Select_TargetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Select_TargetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select trigger" |
*
* @param {Automation_Node_Select_TriggerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_select_trigger: ((inputs?: Automation_Node_Select_TriggerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Select_TriggerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select value" |
*
* @param {Automation_Node_Select_ValueInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_select_value: ((inputs?: Automation_Node_Select_ValueInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Select_ValueInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select webhook" |
*
* @param {Automation_Node_Select_WebhookInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_select_webhook: ((inputs?: Automation_Node_Select_WebhookInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Select_WebhookInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Severity" |
*
* @param {Automation_Node_SeverityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_severity: ((inputs?: Automation_Node_SeverityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_SeverityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "High" |
*
* @param {Automation_Node_Severity_HighInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_severity_high: ((inputs?: Automation_Node_Severity_HighInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Severity_HighInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Low" |
*
* @param {Automation_Node_Severity_LowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_severity_low: ((inputs?: Automation_Node_Severity_LowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Severity_LowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Medium" |
*
* @param {Automation_Node_Severity_MediumInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_severity_medium: ((inputs?: Automation_Node_Severity_MediumInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Severity_MediumInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Simple" |
*
* @param {Automation_Node_SimpleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_simple: ((inputs?: Automation_Node_SimpleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_SimpleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Trigger" |
*
* @param {Automation_Node_TriggerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_trigger: ((inputs?: Automation_Node_TriggerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_TriggerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "value" |
*
* @param {Automation_Node_Value_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_value_placeholder: ((inputs?: Automation_Node_Value_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Value_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Disabled" |
*
* @param {Automation_Node_Webhook_DisabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_webhook_disabled: ((inputs?: Automation_Node_Webhook_DisabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Webhook_DisabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enabled" |
*
* @param {Automation_Node_Webhook_EnabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_node_webhook_enabled: ((inputs?: Automation_Node_Webhook_EnabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Node_Webhook_EnabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "AND" |
*
* @param {Automation_Operator_AndInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_operator_and: ((inputs?: Automation_Operator_AndInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Operator_AndInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delay" |
*
* @param {Automation_Operator_DelayInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_operator_delay: ((inputs?: Automation_Operator_DelayInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Operator_DelayInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "NOT" |
*
* @param {Automation_Operator_NotInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_operator_not: ((inputs?: Automation_Operator_NotInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Operator_NotInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "OR" |
*
* @param {Automation_Operator_OrInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_operator_or: ((inputs?: Automation_Operator_OrInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Operator_OrInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Operator" |
*
* @param {Automation_Operator_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_operator_title: ((inputs?: Automation_Operator_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Operator_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "At {time} on {days}" |
*
* @param {Automation_Schedule_At_DaysInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_schedule_at_days: ((inputs: Automation_Schedule_At_DaysInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Schedule_At_DaysInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Every day at {time}" |
*
* @param {Automation_Schedule_Every_Day_AtInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_schedule_every_day_at: ((inputs: Automation_Schedule_Every_Day_AtInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Schedule_Every_Day_AtInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Every hour" |
* | * | "Every {count} hours" |
*
* @param {Automation_Schedule_Every_HoursInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_schedule_every_hours: ((inputs: Automation_Schedule_Every_HoursInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Schedule_Every_HoursInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Every minute" |
* | * | "Every {count} minutes" |
*
* @param {Automation_Schedule_Every_MinutesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_schedule_every_minutes: ((inputs: Automation_Schedule_Every_MinutesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Schedule_Every_MinutesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Every second" |
* | * | "Every {count} seconds" |
*
* @param {Automation_Schedule_Every_SecondsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_schedule_every_seconds: ((inputs: Automation_Schedule_Every_SecondsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Schedule_Every_SecondsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Not set" |
*
* @param {Automation_Schedule_Not_SetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_schedule_not_set: ((inputs?: Automation_Schedule_Not_SetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Schedule_Not_SetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear brightness" |
*
* @param {Automation_State_Clear_BrightnessInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_clear_brightness: ((inputs?: Automation_State_Clear_BrightnessInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Clear_BrightnessInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear color" |
*
* @param {Automation_State_Clear_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_clear_color: ((inputs?: Automation_State_Clear_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Clear_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear color temperature" |
*
* @param {Automation_State_Clear_Color_TemperatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_clear_color_temperature: ((inputs?: Automation_State_Clear_Color_TemperatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Clear_Color_TemperatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear fan" |
*
* @param {Automation_State_Clear_FanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_clear_fan: ((inputs?: Automation_State_Clear_FanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Clear_FanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear mode" |
*
* @param {Automation_State_Clear_ModeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_clear_mode: ((inputs?: Automation_State_Clear_ModeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Clear_ModeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear power" |
*
* @param {Automation_State_Clear_PowerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_clear_power: ((inputs?: Automation_State_Clear_PowerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Clear_PowerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear swing" |
*
* @param {Automation_State_Clear_SwingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_clear_swing: ((inputs?: Automation_State_Clear_SwingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Clear_SwingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear target temperature" |
*
* @param {Automation_State_Clear_Target_TemperatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_clear_target_temperature: ((inputs?: Automation_State_Clear_Target_TemperatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Clear_Target_TemperatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear transition" |
*
* @param {Automation_State_Clear_TransitionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_clear_transition: ((inputs?: Automation_State_Clear_TransitionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Clear_TransitionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Color temperature" |
*
* @param {Automation_State_Color_TemperatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_color_temperature: ((inputs?: Automation_State_Color_TemperatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Color_TemperatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Fan" |
*
* @param {Automation_State_FanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_fan: ((inputs?: Automation_State_FanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_FanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Mode" |
*
* @param {Automation_State_ModeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_mode: ((inputs?: Automation_State_ModeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_ModeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Target has no settable state capabilities." |
*
* @param {Automation_State_No_CapabilitiesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_no_capabilities: ((inputs?: Automation_State_No_CapabilitiesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_No_CapabilitiesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Power" |
*
* @param {Automation_State_PowerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_power: ((inputs?: Automation_State_PowerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_PowerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select fan" |
*
* @param {Automation_State_Select_FanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_select_fan: ((inputs?: Automation_State_Select_FanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Select_FanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select mode" |
*
* @param {Automation_State_Select_ModeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_select_mode: ((inputs?: Automation_State_Select_ModeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Select_ModeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select swing" |
*
* @param {Automation_State_Select_SwingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_select_swing: ((inputs?: Automation_State_Select_SwingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Select_SwingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set" |
*
* @param {Automation_State_SetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_set: ((inputs?: Automation_State_SetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_SetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Swing" |
*
* @param {Automation_State_SwingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_swing: ((inputs?: Automation_State_SwingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_SwingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Target temperature" |
*
* @param {Automation_State_Target_TemperatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_target_temperature: ((inputs?: Automation_State_Target_TemperatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Target_TemperatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Transition" |
*
* @param {Automation_State_TransitionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_transition: ((inputs?: Automation_State_TransitionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_TransitionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Transition seconds" |
*
* @param {Automation_State_Transition_SecondsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_state_transition_seconds: ((inputs?: Automation_State_Transition_SecondsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_State_Transition_SecondsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Immediate" |
*
* @param {Automation_Timing_ImmediateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_timing_immediate: ((inputs?: Automation_Timing_ImmediateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Timing_ImmediateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Availability" |
*
* @param {Automation_Trigger_AvailabilityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_availability: ((inputs?: Automation_Trigger_AvailabilityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_AvailabilityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Runs when a device goes online or offline" |
*
* @param {Automation_Trigger_Availability_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_availability_description: ((inputs?: Automation_Trigger_Availability_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_Availability_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Custom" |
*
* @param {Automation_Trigger_CustomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_custom: ((inputs?: Automation_Trigger_CustomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_CustomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Runs when a custom event expression matches" |
*
* @param {Automation_Trigger_Custom_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_custom_description: ((inputs?: Automation_Trigger_Custom_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_Custom_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device event" |
*
* @param {Automation_Trigger_Device_EventInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_device_event: ((inputs?: Automation_Trigger_Device_EventInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_Device_EventInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Runs for presses, holds, taps, and other momentary events" |
*
* @param {Automation_Trigger_Device_Event_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_device_event_description: ((inputs?: Automation_Trigger_Device_Event_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_Device_Event_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device state changed" |
*
* @param {Automation_Trigger_Device_StateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_device_state: ((inputs?: Automation_Trigger_Device_StateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_Device_StateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Runs when a reported device value changes" |
*
* @param {Automation_Trigger_Device_State_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_device_state_description: ((inputs?: Automation_Trigger_Device_State_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_Device_State_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Schedule" |
*
* @param {Automation_Trigger_ScheduleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_schedule: ((inputs?: Automation_Trigger_ScheduleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_ScheduleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Runs at a time or repeating interval" |
*
* @param {Automation_Trigger_Schedule_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_schedule_description: ((inputs?: Automation_Trigger_Schedule_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_Schedule_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Incoming webhook" |
*
* @param {Automation_Trigger_WebhookInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_webhook: ((inputs?: Automation_Trigger_WebhookInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_WebhookInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Runs when an external system calls a webhook" |
*
* @param {Automation_Trigger_Webhook_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_trigger_webhook_description: ((inputs?: Automation_Trigger_Webhook_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Trigger_Webhook_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick an action" |
*
* @param {Automation_Validation_Action_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_action_required: ((inputs?: Automation_Validation_Action_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Action_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set an alarm ID" |
*
* @param {Automation_Validation_Alarm_Id_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_alarm_id_required: ((inputs?: Automation_Validation_Alarm_Id_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Alarm_Id_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Mode must be absolute or percent" |
*
* @param {Automation_Validation_Change_Mode_InvalidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_change_mode_invalid: ((inputs?: Automation_Validation_Change_Mode_InvalidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Change_Mode_InvalidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a condition" |
*
* @param {Automation_Validation_Condition_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_condition_required: ((inputs?: Automation_Validation_Condition_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Condition_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enter a cron expression" |
*
* @param {Automation_Validation_Cron_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_cron_required: ((inputs?: Automation_Validation_Cron_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Cron_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set a non-zero delta" |
*
* @param {Automation_Validation_Delta_Non_ZeroInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_delta_non_zero: ((inputs?: Automation_Validation_Delta_Non_ZeroInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Delta_Non_ZeroInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a device" |
*
* @param {Automation_Validation_Device_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_device_required: ((inputs?: Automation_Validation_Device_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Device_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick an effect" |
*
* @param {Automation_Validation_Effect_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_effect_required: ((inputs?: Automation_Validation_Effect_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Effect_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick an event" |
*
* @param {Automation_Validation_Event_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_event_required: ((inputs?: Automation_Validation_Event_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Event_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enter an expression" |
*
* @param {Automation_Validation_Expression_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_expression_required: ((inputs?: Automation_Validation_Expression_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Expression_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a field" |
*
* @param {Automation_Validation_Field_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_field_required: ((inputs?: Automation_Validation_Field_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Field_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Use numbers with numeric comparisons" |
*
* @param {Automation_Validation_Filter_Number_Operator_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_filter_number_operator_type: ((inputs?: Automation_Validation_Filter_Number_Operator_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Filter_Number_Operator_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set every filter path" |
*
* @param {Automation_Validation_Filter_Path_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_filter_path_required: ((inputs?: Automation_Validation_Filter_Path_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Filter_Path_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Use text with text comparisons" |
*
* @param {Automation_Validation_Filter_Text_Operator_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_filter_text_operator_type: ((inputs?: Automation_Validation_Filter_Text_Operator_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Filter_Text_Operator_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set every filter value" |
*
* @param {Automation_Validation_Filter_Value_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_filter_value_required: ((inputs?: Automation_Validation_Filter_Value_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Filter_Value_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set every filter value type" |
*
* @param {Automation_Validation_Filter_Value_Type_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_filter_value_type_required: ((inputs?: Automation_Validation_Filter_Value_Type_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Filter_Value_Type_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set a positive interval" |
*
* @param {Automation_Validation_Interval_PositiveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_interval_positive: ((inputs?: Automation_Validation_Interval_PositiveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Interval_PositiveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Payload must be valid JSON" |
*
* @param {Automation_Validation_Json_InvalidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_json_invalid: ((inputs?: Automation_Validation_Json_InvalidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Json_InvalidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a property" |
*
* @param {Automation_Validation_Property_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_property_required: ((inputs?: Automation_Validation_Property_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Property_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add at least one rule" |
*
* @param {Automation_Validation_Rules_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_rules_required: ((inputs?: Automation_Validation_Rules_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Rules_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Invalid scene reference" |
*
* @param {Automation_Validation_Scene_Reference_InvalidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_scene_reference_invalid: ((inputs?: Automation_Validation_Scene_Reference_InvalidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Scene_Reference_InvalidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add at least two scenes" |
*
* @param {Automation_Validation_Scenes_MinimumInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_scenes_minimum: ((inputs?: Automation_Validation_Scenes_MinimumInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Scenes_MinimumInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Invalid setting" |
*
* @param {Automation_Validation_Setting_InvalidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_setting_invalid: ((inputs?: Automation_Validation_Setting_InvalidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Setting_InvalidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Invalid setting value" |
*
* @param {Automation_Validation_Setting_Value_InvalidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_setting_value_invalid: ((inputs?: Automation_Validation_Setting_Value_InvalidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Setting_Value_InvalidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add at least one setting" |
*
* @param {Automation_Validation_Settings_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_settings_required: ((inputs?: Automation_Validation_Settings_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Settings_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a target" |
*
* @param {Automation_Validation_Target_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_target_required: ((inputs?: Automation_Validation_Target_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Target_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a trigger" |
*
* @param {Automation_Validation_Trigger_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_trigger_required: ((inputs?: Automation_Validation_Trigger_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Trigger_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set a value" |
*
* @param {Automation_Validation_Value_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_value_required: ((inputs?: Automation_Validation_Value_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Value_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a webhook" |
*
* @param {Automation_Validation_Webhook_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_validation_webhook_required: ((inputs?: Automation_Validation_Webhook_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Validation_Webhook_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add filter" |
*
* @param {Automation_Webhook_Add_FilterInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_add_filter: ((inputs?: Automation_Webhook_Add_FilterInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Add_FilterInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhook filter path" |
*
* @param {Automation_Webhook_Filter_Path_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_filter_path_aria: ((inputs?: Automation_Webhook_Filter_Path_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Filter_Path_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhook filter value" |
*
* @param {Automation_Webhook_Filter_Value_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_filter_value_aria: ((inputs?: Automation_Webhook_Filter_Value_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Filter_Value_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Filters" |
*
* @param {Automation_Webhook_FiltersInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_filters: ((inputs?: Automation_Webhook_FiltersInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_FiltersInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Operator" |
*
* @param {Automation_Webhook_OperatorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator: ((inputs?: Automation_Webhook_OperatorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_OperatorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "At least" |
*
* @param {Automation_Webhook_Operator_At_LeastInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator_at_least: ((inputs?: Automation_Webhook_Operator_At_LeastInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Operator_At_LeastInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "At most" |
*
* @param {Automation_Webhook_Operator_At_MostInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator_at_most: ((inputs?: Automation_Webhook_Operator_At_MostInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Operator_At_MostInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Contains" |
*
* @param {Automation_Webhook_Operator_ContainsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator_contains: ((inputs?: Automation_Webhook_Operator_ContainsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Operator_ContainsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Ends with" |
*
* @param {Automation_Webhook_Operator_Ends_WithInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator_ends_with: ((inputs?: Automation_Webhook_Operator_Ends_WithInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Operator_Ends_WithInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Equals" |
*
* @param {Automation_Webhook_Operator_EqualsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator_equals: ((inputs?: Automation_Webhook_Operator_EqualsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Operator_EqualsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Exists" |
*
* @param {Automation_Webhook_Operator_ExistsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator_exists: ((inputs?: Automation_Webhook_Operator_ExistsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Operator_ExistsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Greater than" |
*
* @param {Automation_Webhook_Operator_Greater_ThanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator_greater_than: ((inputs?: Automation_Webhook_Operator_Greater_ThanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Operator_Greater_ThanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Less than" |
*
* @param {Automation_Webhook_Operator_Less_ThanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator_less_than: ((inputs?: Automation_Webhook_Operator_Less_ThanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Operator_Less_ThanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Does not equal" |
*
* @param {Automation_Webhook_Operator_Not_EqualsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator_not_equals: ((inputs?: Automation_Webhook_Operator_Not_EqualsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Operator_Not_EqualsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Does not exist" |
*
* @param {Automation_Webhook_Operator_Not_ExistsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator_not_exists: ((inputs?: Automation_Webhook_Operator_Not_ExistsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Operator_Not_ExistsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Starts with" |
*
* @param {Automation_Webhook_Operator_Starts_WithInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_operator_starts_with: ((inputs?: Automation_Webhook_Operator_Starts_WithInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Operator_Starts_WithInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "JSON path" |
*
* @param {Automation_Webhook_PathInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_path: ((inputs?: Automation_Webhook_PathInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_PathInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove filter" |
*
* @param {Automation_Webhook_Remove_FilterInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_remove_filter: ((inputs?: Automation_Webhook_Remove_FilterInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Remove_FilterInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Body" |
*
* @param {Automation_Webhook_Source_BodyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_source_body: ((inputs?: Automation_Webhook_Source_BodyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Source_BodyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Header" |
*
* @param {Automation_Webhook_Source_HeaderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_source_header: ((inputs?: Automation_Webhook_Source_HeaderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Source_HeaderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Query" |
*
* @param {Automation_Webhook_Source_QueryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_source_query: ((inputs?: Automation_Webhook_Source_QueryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Source_QueryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Boolean" |
*
* @param {Automation_Webhook_Type_BooleanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_type_boolean: ((inputs?: Automation_Webhook_Type_BooleanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Type_BooleanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Null" |
*
* @param {Automation_Webhook_Type_NullInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_type_null: ((inputs?: Automation_Webhook_Type_NullInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Type_NullInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Number" |
*
* @param {Automation_Webhook_Type_NumberInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_type_number: ((inputs?: Automation_Webhook_Type_NumberInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Type_NumberInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Text" |
*
* @param {Automation_Webhook_Type_TextInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_type_text: ((inputs?: Automation_Webhook_Type_TextInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_Type_TextInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Value" |
*
* @param {Automation_Webhook_ValueInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automation_webhook_value: ((inputs?: Automation_Webhook_ValueInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automation_Webhook_ValueInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} action" |
* | * | "{count} actions" |
*
* @param {Automations_Action_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_action_count: ((inputs: Automations_Action_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Action_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Composition" |
*
* @param {Automations_Column_CompositionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_column_composition: ((inputs?: Automations_Column_CompositionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Column_CompositionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Created by" |
*
* @param {Automations_Column_Created_ByInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_column_created_by: ((inputs?: Automations_Column_Created_ByInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Column_Created_ByInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last triggered" |
*
* @param {Automations_Column_Last_TriggeredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_column_last_triggered: ((inputs?: Automations_Column_Last_TriggeredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Column_Last_TriggeredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Meta" |
*
* @param {Automations_Column_MetaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_column_meta: ((inputs?: Automations_Column_MetaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Column_MetaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Automations_Column_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_column_name: ((inputs?: Automations_Column_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Column_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create automation" |
*
* @param {Automations_CreateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_create: ((inputs?: Automations_CreateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_CreateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Give your new automation a name. You can add triggers and actions in the graph editor." |
*
* @param {Automations_Create_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_create_description: ((inputs?: Automations_Create_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Create_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create your first automation" |
*
* @param {Automations_Create_FirstInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_create_first: ((inputs?: Automations_Create_FirstInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Create_FirstInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create more" |
*
* @param {Automations_Create_MoreInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_create_more: ((inputs?: Automations_Create_MoreInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Create_MoreInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create" |
*
* @param {Automations_Create_ShortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_create_short: ((inputs?: Automations_Create_ShortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Create_ShortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Creating…" |
*
* @param {Automations_CreatingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_creating: ((inputs?: Automations_CreatingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_CreatingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Are you sure you want to delete “{name}”? This action cannot be undone." |
*
* @param {Automations_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_delete_description: ((inputs: Automations_Delete_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Delete_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This permanently deletes the selected automations and their nodes. This cannot be undone." |
*
* @param {Automations_Delete_Many_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_delete_many_description: ((inputs?: Automations_Delete_Many_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Delete_Many_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Delete {count} automation?" |
* | * | "Delete {count} automations?" |
*
* @param {Automations_Delete_Many_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_delete_many_title: ((inputs: Automations_Delete_Many_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Delete_Many_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete automation" |
*
* @param {Automations_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_delete_title: ((inputs?: Automations_Delete_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Delete_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Disable {name}" |
*
* @param {Automations_DisableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_disable: ((inputs: Automations_DisableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_DisableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit automation" |
*
* @param {Automations_EditInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_edit: ((inputs?: Automations_EditInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_EditInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No automations yet." |
*
* @param {Automations_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_empty: ((inputs?: Automations_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create event-driven rules with triggers, conditions, and actions." |
*
* @param {Automations_Empty_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_empty_help: ((inputs?: Automations_Empty_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Empty_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enable {name}" |
*
* @param {Automations_EnableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_enable: ((inputs: Automations_EnableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_EnableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not create the automation." |
*
* @param {Automations_Error_CreateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_error_create: ((inputs?: Automations_Error_CreateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Error_CreateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the automation." |
*
* @param {Automations_Error_DeleteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_error_delete: ((inputs?: Automations_Error_DeleteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Error_DeleteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the automations." |
*
* @param {Automations_Error_Delete_ManyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_error_delete_many: ((inputs?: Automations_Error_Delete_ManyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Error_Delete_ManyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not change the icon." |
*
* @param {Automations_Error_IconInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_error_icon: ((inputs?: Automations_Error_IconInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Error_IconInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not rename the automation." |
*
* @param {Automations_Error_RenameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_error_rename: ((inputs?: Automations_Error_RenameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Error_RenameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not toggle the automation." |
*
* @param {Automations_Error_ToggleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_error_toggle: ((inputs?: Automations_Error_ToggleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Error_ToggleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Action" |
*
* @param {Automations_Filter_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_filter_action: ((inputs?: Automations_Filter_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Filter_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device" |
*
* @param {Automations_Filter_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_filter_device: ((inputs?: Automations_Filter_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Filter_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Empty" |
*
* @param {Automations_Filter_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_filter_empty: ((inputs?: Automations_Filter_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Filter_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enabled" |
*
* @param {Automations_Filter_EnabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_filter_enabled: ((inputs?: Automations_Filter_EnabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Filter_EnabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scene" |
*
* @param {Automations_Filter_SceneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_filter_scene: ((inputs?: Automations_Filter_SceneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Filter_SceneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Trigger" |
*
* @param {Automations_Filter_TriggerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_filter_trigger: ((inputs?: Automations_Filter_TriggerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Filter_TriggerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "fired {time}" |
*
* @param {Automations_FiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_fired: ((inputs: Automations_FiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_FiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automation name" |
*
* @param {Automations_Name_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_name_placeholder: ((inputs?: Automations_Name_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Name_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No automations match your filters." |
*
* @param {Automations_No_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_no_match: ((inputs?: Automations_No_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_No_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} node" |
* | * | "{count} nodes" |
*
* @param {Automations_Node_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_node_count: ((inputs: Automations_Node_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Node_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} operator" |
* | * | "{count} operators" |
*
* @param {Automations_Operator_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_operator_count: ((inputs: Automations_Operator_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Operator_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search automations…" |
*
* @param {Automations_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_search: ((inputs?: Automations_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select {name}" |
*
* @param {Automations_SelectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_select: ((inputs: Automations_SelectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_SelectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automations" |
*
* @param {Automations_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_title: ((inputs?: Automations_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} trigger" |
* | * | "{count} triggers" |
*
* @param {Automations_Trigger_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_trigger_count: ((inputs: Automations_Trigger_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Trigger_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Event" |
*
* @param {Automations_Trigger_EventInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_trigger_event: ((inputs?: Automations_Trigger_EventInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Trigger_EventInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Schedule" |
*
* @param {Automations_Trigger_ScheduleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const automations_trigger_schedule: ((inputs?: Automations_Trigger_ScheduleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Automations_Trigger_ScheduleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "at {time}" |
*
* @param {Button_Action_AtInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const button_action_at: ((inputs: Button_Action_AtInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Button_Action_AtInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last action" |
*
* @param {Button_Last_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const button_last_action: ((inputs?: Button_Last_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Button_Last_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last seen: {time}" |
*
* @param {Button_Last_SeenInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const button_last_seen: ((inputs: Button_Last_SeenInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Button_Last_SeenInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No action recorded" |
*
* @param {Button_No_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const button_no_action: ((inputs?: Button_No_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Button_No_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Button status" |
*
* @param {Button_StatusInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const button_status: ((inputs?: Button_StatusInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Button_StatusInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Hue and saturation" |
*
* @param {Color_Picker_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const color_picker_aria: ((inputs?: Color_Picker_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Color_Picker_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add to" |
*
* @param {Common_Add_ToInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_add_to: ((inputs?: Common_Add_ToInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Add_ToInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Saffron Hive" |
*
* @param {Common_Brand_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_brand_name: ((inputs?: Common_Brand_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Brand_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Common_CancelInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_cancel: ((inputs?: Common_CancelInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_CancelInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear" |
*
* @param {Common_ClearInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_clear: ((inputs?: Common_ClearInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_ClearInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Close" |
*
* @param {Common_CloseInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_close: ((inputs?: Common_CloseInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_CloseInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Complete" |
*
* @param {Common_CompleteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_complete: ((inputs?: Common_CompleteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_CompleteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Confirm" |
*
* @param {Common_ConfirmInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_confirm: ((inputs?: Common_ConfirmInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_ConfirmInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Continue" |
*
* @param {Common_ContinueInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_continue: ((inputs?: Common_ContinueInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_ContinueInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Copied!" |
*
* @param {Common_CopiedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_copied: ((inputs?: Common_CopiedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_CopiedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Copy" |
*
* @param {Common_CopyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_copy: ((inputs?: Common_CopyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_CopyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Copy ID" |
*
* @param {Common_Copy_IdInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_copy_id: ((inputs?: Common_Copy_IdInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Copy_IdInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Common_DeleteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_delete: ((inputs?: Common_DeleteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_DeleteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Disable" |
*
* @param {Common_DisableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_disable: ((inputs?: Common_DisableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_DisableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Dismiss" |
*
* @param {Common_DismissInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_dismiss: ((inputs?: Common_DismissInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_DismissInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Common_EditInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_edit: ((inputs?: Common_EditInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_EditInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enable" |
*
* @param {Common_EnableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_enable: ((inputs?: Common_EnableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_EnableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Something went wrong." |
*
* @param {Common_Error_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_error_generic: ((inputs?: Common_Error_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Error_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not load data." |
*
* @param {Common_Error_Load_DataInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_error_load_data: ((inputs?: Common_Error_Load_DataInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Error_Load_DataInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not reach the server." |
*
* @param {Common_Error_Server_UnreachableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_error_server_unreachable: ((inputs?: Common_Error_Server_UnreachableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Error_Server_UnreachableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Try again, or head back to the dashboard." |
*
* @param {Common_Error_Try_AgainInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_error_try_again: ((inputs?: Common_Error_Try_AgainInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Error_Try_AgainInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "In progress" |
*
* @param {Common_In_ProgressInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_in_progress: ((inputs?: Common_In_ProgressInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_In_ProgressInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Loading…" |
*
* @param {Common_LoadingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_loading: ((inputs?: Common_LoadingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_LoadingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No" |
*
* @param {Common_NoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_no: ((inputs?: Common_NoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_NoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "None" |
*
* @param {Common_NoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_none: ((inputs?: Common_NoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_NoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Common_RemoveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_remove: ((inputs?: Common_RemoveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_RemoveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Save" |
*
* @param {Common_SaveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_save: ((inputs?: Common_SaveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_SaveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Saving…" |
*
* @param {Common_SavingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_saving: ((inputs?: Common_SavingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_SavingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search…" |
*
* @param {Common_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_search: ((inputs?: Common_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear search" |
*
* @param {Common_Search_ClearInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_search_clear: ((inputs?: Common_Search_ClearInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Search_ClearInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select" |
*
* @param {Common_SelectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_select: ((inputs?: Common_SelectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_SelectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Successful" |
*
* @param {Common_SuccessfulInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_successful: ((inputs?: Common_SuccessfulInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_SuccessfulInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Supported" |
*
* @param {Common_SupportedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_supported: ((inputs?: Common_SupportedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_SupportedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "HH" |
*
* @param {Common_Time_Hour_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_time_hour_placeholder: ((inputs?: Common_Time_Hour_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Time_Hour_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "MM" |
*
* @param {Common_Time_Minute_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_time_minute_placeholder: ((inputs?: Common_Time_Minute_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Time_Minute_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "SS" |
*
* @param {Common_Time_Second_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_time_second_placeholder: ((inputs?: Common_Time_Second_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Time_Second_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Try again" |
*
* @param {Common_Try_AgainInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_try_again: ((inputs?: Common_Try_AgainInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Try_AgainInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unknown ({value})" |
*
* @param {Common_Unknown_ValueInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_unknown_value: ((inputs: Common_Unknown_ValueInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_Unknown_ValueInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unsupported" |
*
* @param {Common_UnsupportedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_unsupported: ((inputs?: Common_UnsupportedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_UnsupportedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Uploading…" |
*
* @param {Common_UploadingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_uploading: ((inputs?: Common_UploadingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_UploadingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Yes" |
*
* @param {Common_YesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const common_yes: ((inputs?: Common_YesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Common_YesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Authentication failed. Check the credentials." |
*
* @param {Connection_Authentication_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const connection_authentication_failed: ((inputs?: Connection_Authentication_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Connection_Authentication_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Connected successfully" |
*
* @param {Connection_ConnectedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const connection_connected: ((inputs?: Connection_ConnectedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Connection_ConnectedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Connection failed." |
*
* @param {Connection_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const connection_failed: ((inputs?: Connection_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Connection_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The connection timed out." |
*
* @param {Connection_TimeoutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const connection_timeout: ((inputs?: Connection_TimeoutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Connection_TimeoutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The secure connection could not be established." |
*
* @param {Connection_Tls_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const connection_tls_failed: ((inputs?: Connection_Tls_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Connection_Tls_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The integration is unavailable." |
*
* @param {Connection_UnavailableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const connection_unavailable: ((inputs?: Connection_UnavailableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Connection_UnavailableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The integration is not configured." |
*
* @param {Connection_UnconfiguredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const connection_unconfigured: ((inputs?: Connection_UnconfiguredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Connection_UnconfiguredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The service could not be reached." |
*
* @param {Connection_UnreachableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const connection_unreachable: ((inputs?: Connection_UnreachableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Connection_UnreachableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | role | output |
* | --- | --- |
* | "door" | "Door" |
* | "window" | "Window" |
* | * | "Contact" |
*
* @param {Contact_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const contact_name: ((inputs: Contact_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Contact_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | role | openPluralExact | openPlural | unknownPluralExact | unknownPlural | output |
* | --- | --- | --- | --- | --- | --- |
* | "door" | "0" | * | "0" | * | "No open door" |
* | "door" | * | "one" | "0" | * | "{open} door open" |
* | "door" | * | * | "0" | * | "{open} doors open" |
* | "window" | "0" | * | "0" | * | "No open window" |
* | "window" | * | "one" | "0" | * | "{open} window open" |
* | "window" | * | * | "0" | * | "{open} windows open" |
* | * | "0" | * | "0" | * | "No open contact" |
* | * | * | "one" | "0" | * | "{open} contact open" |
* | * | * | * | "0" | * | "{open} contacts open" |
* | "door" | "0" | * | * | * | "No open door, {unknown} unknown" |
* | "door" | * | "one" | * | * | "{open} door open, {unknown} unknown" |
* | "door" | * | * | * | * | "{open} doors open, {unknown} unknown" |
* | "window" | "0" | * | * | * | "No open window, {unknown} unknown" |
* | "window" | * | "one" | * | * | "{open} window open, {unknown} unknown" |
* | "window" | * | * | * | * | "{open} windows open, {unknown} unknown" |
* | * | "0" | * | * | * | "No open contact, {unknown} unknown" |
* | * | * | "one" | * | * | "{open} contact open, {unknown} unknown" |
* | * | * | * | * | * | "{open} contacts open, {unknown} unknown" |
*
* @param {Contact_Summary_MultipleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const contact_summary_multiple: ((inputs: Contact_Summary_MultipleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Contact_Summary_MultipleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | role | state | output |
* | --- | --- | --- |
* | "door" | "open" | "Door open" |
* | "window" | "open" | "Window open" |
* | * | "open" | "Contact open" |
* | "door" | "closed" | "Door closed" |
* | "window" | "closed" | "Window closed" |
* | * | "closed" | "Contact closed" |
* | "door" | * | "Door unknown" |
* | "window" | * | "Window unknown" |
* | * | * | "Contact unknown" |
*
* @param {Contact_Summary_SingleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const contact_summary_single: ((inputs: Contact_Summary_SingleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Contact_Summary_SingleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Apartment" |
*
* @param {Dashboard_ApartmentInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const dashboard_apartment: ((inputs?: Dashboard_ApartmentInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Dashboard_ApartmentInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No integrations yet." |
*
* @param {Dashboard_No_IntegrationsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const dashboard_no_integrations: ((inputs?: Dashboard_No_IntegrationsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Dashboard_No_IntegrationsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Connect an integration to discover devices and begin setting up your home." |
*
* @param {Dashboard_No_Integrations_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const dashboard_no_integrations_help: ((inputs?: Dashboard_No_Integrations_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Dashboard_No_Integrations_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No rooms configured yet." |
*
* @param {Dashboard_No_RoomsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const dashboard_no_rooms: ((inputs?: Dashboard_No_RoomsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Dashboard_No_RoomsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create rooms and assign devices to build your dashboard." |
*
* @param {Dashboard_No_Rooms_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const dashboard_no_rooms_help: ((inputs?: Dashboard_No_Rooms_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Dashboard_No_Rooms_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rooms" |
*
* @param {Dashboard_RoomsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const dashboard_rooms: ((inputs?: Dashboard_RoomsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Dashboard_RoomsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set up your first integration" |
*
* @param {Dashboard_Setup_IntegrationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const dashboard_setup_integration: ((inputs?: Dashboard_Setup_IntegrationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Dashboard_Setup_IntegrationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add" |
*
* @param {Data_Viewer_AddInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_add: ((inputs?: Data_Viewer_AddInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_AddInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add source" |
*
* @param {Data_Viewer_Add_SourceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_add_source: ((inputs?: Data_Viewer_Add_SourceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_Add_SourceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick devices, rooms, groups, or the apartment to plot." |
*
* @param {Data_Viewer_Add_Source_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_add_source_description: ((inputs?: Data_Viewer_Add_Source_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_Add_Source_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Apartment" |
*
* @param {Data_Viewer_ApartmentInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_apartment: ((inputs?: Data_Viewer_ApartmentInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_ApartmentInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Apartment (all devices)" |
*
* @param {Data_Viewer_Apartment_AllInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_apartment_all: ((inputs?: Data_Viewer_Apartment_AllInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_Apartment_AllInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Buttons" |
*
* @param {Data_Viewer_Devices_ButtonsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_devices_buttons: ((inputs?: Data_Viewer_Devices_ButtonsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_Devices_ButtonsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Lights" |
*
* @param {Data_Viewer_Devices_LightsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_devices_lights: ((inputs?: Data_Viewer_Devices_LightsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_Devices_LightsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Other devices" |
*
* @param {Data_Viewer_Devices_OtherInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_devices_other: ((inputs?: Data_Viewer_Devices_OtherInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_Devices_OtherInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Plugs" |
*
* @param {Data_Viewer_Devices_PlugsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_devices_plugs: ((inputs?: Data_Viewer_Devices_PlugsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_Devices_PlugsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sensors" |
*
* @param {Data_Viewer_Devices_SensorsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_devices_sensors: ((inputs?: Data_Viewer_Devices_SensorsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_Devices_SensorsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Speakers" |
*
* @param {Data_Viewer_Devices_SpeakersInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_devices_speakers: ((inputs?: Data_Viewer_Devices_SpeakersInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_Devices_SpeakersInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add a source to get started." |
*
* @param {Data_Viewer_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_empty: ((inputs?: Data_Viewer_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Groups" |
*
* @param {Data_Viewer_GroupsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_groups: ((inputs?: Data_Viewer_GroupsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_GroupsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No samples recorded." |
*
* @param {Data_Viewer_No_SamplesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_no_samples: ((inputs?: Data_Viewer_No_SamplesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_No_SamplesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove {name}" |
*
* @param {Data_Viewer_Remove_SourceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_remove_source: ((inputs: Data_Viewer_Remove_SourceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_Remove_SourceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rooms" |
*
* @param {Data_Viewer_RoomsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_rooms: ((inputs?: Data_Viewer_RoomsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_RoomsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sources" |
*
* @param {Data_Viewer_SourcesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_sources: ((inputs?: Data_Viewer_SourcesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_SourcesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Data viewer" |
*
* @param {Data_Viewer_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const data_viewer_title: ((inputs?: Data_Viewer_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Data_Viewer_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Adjust {name} climate" |
*
* @param {Device_Adjust_Climate_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_adjust_climate_named: ((inputs: Device_Adjust_Climate_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Adjust_Climate_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Adjust {name}" |
*
* @param {Device_Adjust_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_adjust_named: ((inputs: Device_Adjust_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Adjust_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Apply" |
*
* @param {Device_ApplyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_apply: ((inputs?: Device_ApplyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_ApplyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Applying…" |
*
* @param {Device_ApplyingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_applying: ((inputs?: Device_ApplyingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_ApplyingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Back to devices" |
*
* @param {Device_Back_To_DevicesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_back_to_devices: ((inputs?: Device_Back_To_DevicesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Back_To_DevicesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Brightness" |
*
* @param {Device_BrightnessInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_brightness: ((inputs?: Device_BrightnessInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_BrightnessInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Color" |
*
* @param {Device_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_color: ((inputs?: Device_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About {name}" |
*
* @param {Device_Config_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_config_about: ((inputs: Device_Config_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Config_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add at least one setting." |
*
* @param {Device_Config_Add_OneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_config_add_one: ((inputs?: Device_Config_Add_OneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Config_Add_OneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add setting" |
*
* @param {Device_Config_Add_SettingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_config_add_setting: ((inputs?: Device_Config_Add_SettingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Config_Add_SettingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove {name}" |
*
* @param {Device_Config_RemoveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_config_remove: ((inputs: Device_Config_RemoveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Config_RemoveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not apply the device settings." |
*
* @param {Device_Configuration_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_configuration_failed: ((inputs?: Device_Configuration_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Configuration_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The device did not confirm its settings. You can try applying them again." |
*
* @param {Device_Configuration_TimeoutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_configuration_timeout: ((inputs?: Device_Configuration_TimeoutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Configuration_TimeoutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Controls are unavailable while this device is disabled." |
*
* @param {Device_Controls_DisabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_controls_disabled: ((inputs?: Device_Controls_DisabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Controls_DisabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Turn Enabled back on above to command it again." |
*
* @param {Device_Controls_Enable_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_controls_enable_help: ((inputs?: Device_Controls_Enable_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Controls_Enable_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Copy device ID" |
*
* @param {Device_Copy_IdInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_copy_id: ((inputs?: Device_Copy_IdInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Copy_IdInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Fan" |
*
* @param {Device_FanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_fan: ((inputs?: Device_FanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_FanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device" |
*
* @param {Device_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_generic: ((inputs?: Device_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "History" |
*
* @param {Device_HistoryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_history: ((inputs?: Device_HistoryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_HistoryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device ID" |
*
* @param {Device_IdInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_id: ((inputs?: Device_IdInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_IdInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} device" |
*
* @param {Device_Image_AltInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_image_alt: ((inputs: Device_Image_AltInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Image_AltInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device info" |
*
* @param {Device_InfoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_info: ((inputs?: Device_InfoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_InfoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Not in any room or group yet." |
*
* @param {Device_Memberships_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_memberships_empty: ((inputs?: Device_Memberships_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Memberships_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Mode" |
*
* @param {Device_ModeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_mode: ((inputs?: Device_ModeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_ModeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device Name" |
*
* @param {Device_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_name: ((inputs?: Device_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No state information available for this device." |
*
* @param {Device_No_StateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_no_state: ((inputs?: Device_No_StateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_No_StateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device not found" |
*
* @param {Device_Not_FoundInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_not_found: ((inputs?: Device_Not_FoundInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Not_FoundInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The device you are looking for does not exist or has been removed." |
*
* @param {Device_Not_Found_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_not_found_help: ((inputs?: Device_Not_Found_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Not_Found_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Power" |
*
* @param {Device_PowerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_power: ((inputs?: Device_PowerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_PowerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Roles" |
*
* @param {Device_RolesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_roles: ((inputs?: Device_RolesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_RolesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Appliance" |
*
* @param {Device_Roles_ApplianceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_roles_appliance: ((inputs?: Device_Roles_ApplianceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Roles_ApplianceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Contact" |
*
* @param {Device_Roles_ContactInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_roles_contact: ((inputs?: Device_Roles_ContactInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Roles_ContactInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Controls" |
*
* @param {Device_Roles_ControlsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_roles_controls: ((inputs?: Device_Roles_ControlsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Roles_ControlsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "General contact" |
*
* @param {Device_Roles_General_ContactInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_roles_general_contact: ((inputs?: Device_Roles_General_ContactInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Roles_General_ContactInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Used in map" |
*
* @param {Device_Roles_Used_In_MapInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_roles_used_in_map: ((inputs?: Device_Roles_Used_In_MapInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Roles_Used_In_MapInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save the device." |
*
* @param {Device_Save_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_save_failed: ((inputs?: Device_Save_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Save_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select fan" |
*
* @param {Device_Select_FanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_select_fan: ((inputs?: Device_Select_FanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Select_FanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select mode" |
*
* @param {Device_Select_ModeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_select_mode: ((inputs?: Device_Select_ModeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Select_ModeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select speed" |
*
* @param {Device_Select_SpeedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_select_speed: ((inputs?: Device_Select_SpeedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Select_SpeedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select swing" |
*
* @param {Device_Select_SwingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_select_swing: ((inputs?: Device_Select_SwingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Select_SwingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Settings" |
*
* @param {Device_SettingsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_settings: ((inputs?: Device_SettingsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_SettingsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Swing" |
*
* @param {Device_SwingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_swing: ((inputs?: Device_SwingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_SwingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Target" |
*
* @param {Device_TargetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_target: ((inputs?: Device_TargetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_TargetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Target temperature" |
*
* @param {Device_Target_TemperatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_target_temperature: ((inputs?: Device_Target_TemperatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Target_TemperatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Lower temperature" |
*
* @param {Device_Temperature_LowerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_temperature_lower: ((inputs?: Device_Temperature_LowerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Temperature_LowerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Raise temperature" |
*
* @param {Device_Temperature_RaiseInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_temperature_raise: ((inputs?: Device_Temperature_RaiseInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Temperature_RaiseInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Toggle {name}" |
*
* @param {Device_Toggle_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_toggle_named: ((inputs: Device_Toggle_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Toggle_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Button" |
*
* @param {Device_Type_ButtonInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_type_button: ((inputs?: Device_Type_ButtonInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Type_ButtonInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Climate" |
*
* @param {Device_Type_ClimateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_type_climate: ((inputs?: Device_Type_ClimateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Type_ClimateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Hub" |
*
* @param {Device_Type_HubInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_type_hub: ((inputs?: Device_Type_HubInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Type_HubInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Light" |
*
* @param {Device_Type_LightInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_type_light: ((inputs?: Device_Type_LightInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Type_LightInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Plug" |
*
* @param {Device_Type_PlugInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_type_plug: ((inputs?: Device_Type_PlugInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Type_PlugInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sensor" |
*
* @param {Device_Type_SensorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_type_sensor: ((inputs?: Device_Type_SensorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Type_SensorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Speaker" |
*
* @param {Device_Type_SpeakerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_type_speaker: ((inputs?: Device_Type_SpeakerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Type_SpeakerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Switch" |
*
* @param {Device_Type_SwitchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_type_switch: ((inputs?: Device_Type_SwitchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Type_SwitchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unknown" |
*
* @param {Device_Type_UnknownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_type_unknown: ((inputs?: Device_Type_UnknownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_Type_UnknownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Update" |
*
* @param {Device_UpdateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_update: ((inputs?: Device_UpdateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_UpdateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Waiting for device…" |
*
* @param {Device_WaitingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_waiting: ((inputs?: Device_WaitingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_WaitingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "White" |
*
* @param {Device_WhiteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const device_white: ((inputs?: Device_WhiteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Device_WhiteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device actions" |
*
* @param {Devices_ActionsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_actions: ((inputs?: Devices_ActionsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_ActionsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add to room or group" |
*
* @param {Devices_Add_To_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_add_to_action: ((inputs?: Devices_Add_To_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Add_To_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick one or more rooms and groups for this device." |
*
* @param {Devices_Add_To_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_add_to_description: ((inputs?: Devices_Add_To_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Add_To_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add to rooms or groups" |
*
* @param {Devices_Add_To_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_add_to_generic: ((inputs?: Devices_Add_To_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Add_To_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add {name} to rooms or groups" |
*
* @param {Devices_Add_To_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_add_to_title: ((inputs: Devices_Add_To_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Add_To_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} brightness" |
*
* @param {Devices_Brightness_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_brightness_named: ((inputs: Devices_Brightness_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Brightness_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the device." |
*
* @param {Devices_Delete_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_delete_failed: ((inputs?: Devices_Delete_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Delete_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Delete {count} device from Hive? This hides and disables them in Hive only." |
* | * | "Delete {count} devices from Hive? This hides and disables them in Hive only." |
*
* @param {Devices_Delete_Many_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_delete_many_description: ((inputs: Devices_Delete_Many_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Delete_Many_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete devices" |
*
* @param {Devices_Delete_Many_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_delete_many_title: ((inputs?: Devices_Delete_Many_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Delete_Many_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete {name}" |
*
* @param {Devices_Delete_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_delete_named: ((inputs: Devices_Delete_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Delete_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete “{name}” from Hive? This hides and disables it in Hive only." |
*
* @param {Devices_Delete_One_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_delete_one_description: ((inputs: Devices_Delete_One_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Delete_One_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete device" |
*
* @param {Devices_Delete_One_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_delete_one_title: ((inputs?: Devices_Delete_One_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Delete_One_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Disable device" |
*
* @param {Devices_DisableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_disable: ((inputs?: Devices_DisableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_DisableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit device" |
*
* @param {Devices_EditInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_edit: ((inputs?: Devices_EditInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_EditInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enable device" |
*
* @param {Devices_EnableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_enable: ((inputs?: Devices_EnableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_EnableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "New devices" |
*
* @param {Devices_NewInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_new: ((inputs?: Devices_NewInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_NewInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No devices match your filters." |
*
* @param {Devices_No_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_no_match: ((inputs?: Devices_No_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_No_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No devices discovered yet." |
*
* @param {Devices_NoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_none: ((inputs?: Devices_NoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_NoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Devices appear here once an integration is connected." |
*
* @param {Devices_None_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_none_help: ((inputs?: Devices_None_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_None_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Offline" |
*
* @param {Devices_OfflineInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_offline: ((inputs?: Devices_OfflineInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_OfflineInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Online" |
*
* @param {Devices_OnlineInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_online: ((inputs?: Devices_OnlineInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_OnlineInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Restore" |
*
* @param {Devices_RestoreInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_restore: ((inputs?: Devices_RestoreInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_RestoreInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not restore the device." |
*
* @param {Devices_Restore_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_restore_failed: ((inputs?: Devices_Restore_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Restore_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Restore {name}" |
*
* @param {Devices_Restore_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_restore_named: ((inputs: Devices_Restore_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Restore_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search devices…" |
*
* @param {Devices_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_search: ((inputs?: Devices_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Trigger {name} event" |
*
* @param {Devices_Trigger_EventInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const devices_trigger_event: ((inputs: Devices_Trigger_EventInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Devices_Trigger_EventInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Run" |
*
* @param {Effect_Action_RunInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_action_run: ((inputs?: Effect_Action_RunInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Action_RunInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Back to effects" |
*
* @param {Effect_BackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_back: ((inputs?: Effect_BackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_BackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Brightness" |
*
* @param {Effect_Cap_BrightnessInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_cap_brightness: ((inputs?: Effect_Cap_BrightnessInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Cap_BrightnessInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Color" |
*
* @param {Effect_Cap_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_cap_color: ((inputs?: Effect_Cap_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Cap_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Color temperature" |
*
* @param {Effect_Cap_Color_TempInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_cap_color_temp: ((inputs?: Effect_Cap_Color_TempInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Cap_Color_TempInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "On/Off" |
*
* @param {Effect_Cap_On_OffInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_cap_on_off: ((inputs?: Effect_Cap_On_OffInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Cap_On_OffInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Change icon" |
*
* @param {Effect_Change_IconInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_change_icon: ((inputs?: Effect_Change_IconInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Change_IconInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect deleted" |
*
* @param {Effect_DeletedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_deleted: ((inputs?: Effect_DeletedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_DeletedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect" |
*
* @param {Effect_FallbackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_fallback: ((inputs?: Effect_FallbackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_FallbackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not load the effect." |
*
* @param {Effect_Load_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_load_failed: ((inputs?: Effect_Load_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Load_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect name" |
*
* @param {Effect_Name_LabelInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_name_label: ((inputs?: Effect_Name_LabelInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Name_LabelInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Zigbee effects can't be edited" |
*
* @param {Effect_Native_Read_OnlyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_native_read_only: ((inputs?: Effect_Native_Read_OnlyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Native_Read_OnlyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect not found" |
*
* @param {Effect_Not_FoundInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_not_found: ((inputs?: Effect_Not_FoundInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Not_FoundInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The effect you're looking for doesn't exist or has been removed." |
*
* @param {Effect_Not_Found_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_not_found_help: ((inputs?: Effect_Not_Found_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Not_Found_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Running with the last saved version. Save first to run current edits." |
*
* @param {Effect_Running_SavedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_running_saved: ((inputs?: Effect_Running_SavedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Running_SavedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save the effect." |
*
* @param {Effect_Save_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_save_failed: ((inputs?: Effect_Save_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Save_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add clip to {name}" |
*
* @param {Effect_Timeline_Add_Clip_ToInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_add_clip_to: ((inputs: Effect_Timeline_Add_Clip_ToInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Add_Clip_ToInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add track" |
*
* @param {Effect_Timeline_Add_TrackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_add_track: ((inputs?: Effect_Timeline_Add_TrackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Add_TrackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add a track before pasting" |
*
* @param {Effect_Timeline_Add_Track_FirstInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_add_track_first: ((inputs?: Effect_Timeline_Add_Track_FirstInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Add_Track_FirstInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect timeline" |
*
* @param {Effect_Timeline_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_aria: ((inputs?: Effect_Timeline_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Brightness {value}" |
*
* @param {Effect_Timeline_Brightness_SummaryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_brightness_summary: ((inputs: Effect_Timeline_Brightness_SummaryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Brightness_SummaryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Brightness ({value})" |
*
* @param {Effect_Timeline_Brightness_ValueInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_brightness_value: ((inputs: Effect_Timeline_Brightness_ValueInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Brightness_ValueInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} clip" |
* | * | "{count} clips" |
*
* @param {Effect_Timeline_Clip_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_clip_count: ((inputs: Effect_Timeline_Clip_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Clip_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Copy clip" |
*
* @param {Effect_Timeline_Copy_ClipInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_copy_clip: ((inputs?: Effect_Timeline_Copy_ClipInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Copy_ClipInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Drag to set loop end" |
*
* @param {Effect_Timeline_Drag_Loop_EndInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_drag_loop_end: ((inputs?: Effect_Timeline_Drag_Loop_EndInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Drag_Loop_EndInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Duration {duration}" |
*
* @param {Effect_Timeline_DurationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_duration: ((inputs: Effect_Timeline_DurationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_DurationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit clip" |
*
* @param {Effect_Timeline_Edit_ClipInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_edit_clip: ((inputs?: Effect_Timeline_Edit_ClipInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Edit_ClipInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No tracks yet. Add a track to start." |
*
* @param {Effect_Timeline_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_empty: ((inputs?: Effect_Timeline_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "End {end} (gap {gap})" |
*
* @param {Effect_Timeline_End_GapInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_end_gap: ((inputs: Effect_Timeline_End_GapInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_End_GapInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Fit to viewport" |
*
* @param {Effect_Timeline_FitInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_fit: ((inputs?: Effect_Timeline_FitInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_FitInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Loop effect" |
*
* @param {Effect_Timeline_Loop_EffectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_loop_effect: ((inputs?: Effect_Timeline_Loop_EffectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Loop_EffectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Mireds: {value}" |
*
* @param {Effect_Timeline_MiredsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_mireds: ((inputs: Effect_Timeline_MiredsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_MiredsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Zigbee effect" |
*
* @param {Effect_Timeline_NativeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_native: ((inputs?: Effect_Timeline_NativeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_NativeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "(Zigbee effect)" |
*
* @param {Effect_Timeline_Native_FallbackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_native_fallback: ((inputs?: Effect_Timeline_Native_FallbackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Native_FallbackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No Zigbee effects available" |
*
* @param {Effect_Timeline_No_NativeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_no_native: ((inputs?: Effect_Timeline_No_NativeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_No_NativeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No free space on this track for the new clip" |
*
* @param {Effect_Timeline_No_Space_NewInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_no_space_new: ((inputs?: Effect_Timeline_No_Space_NewInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_No_Space_NewInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No free space on this track for the pasted clip" |
*
* @param {Effect_Timeline_No_Space_PasteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_no_space_paste: ((inputs?: Effect_Timeline_No_Space_PasteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_No_Space_PasteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "On / off" |
*
* @param {Effect_Timeline_On_OffInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_on_off: ((inputs?: Effect_Timeline_On_OffInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_On_OffInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Paste clip" |
*
* @param {Effect_Timeline_Paste_ClipInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_paste_clip: ((inputs?: Effect_Timeline_Paste_ClipInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Paste_ClipInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Random transition" |
*
* @param {Effect_Timeline_Random_TransitionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_random_transition: ((inputs?: Effect_Timeline_Random_TransitionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Random_TransitionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove clip" |
*
* @param {Effect_Timeline_Remove_ClipInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_remove_clip: ((inputs?: Effect_Timeline_Remove_ClipInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Remove_ClipInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove track" |
*
* @param {Effect_Timeline_Remove_TrackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_remove_track: ((inputs?: Effect_Timeline_Remove_TrackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Remove_TrackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Required:" |
*
* @param {Effect_Timeline_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_required: ((inputs?: Effect_Timeline_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Resize clip" |
*
* @param {Effect_Timeline_Resize_ClipInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_resize_clip: ((inputs?: Effect_Timeline_Resize_ClipInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Resize_ClipInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Start (ms)" |
*
* @param {Effect_Timeline_Start_MsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_start_ms: ((inputs?: Effect_Timeline_Start_MsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Start_MsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Start in milliseconds" |
*
* @param {Effect_Timeline_Start_Ms_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_start_ms_aria: ((inputs?: Effect_Timeline_Start_Ms_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Start_Ms_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "State" |
*
* @param {Effect_Timeline_StateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_state: ((inputs?: Effect_Timeline_StateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_StateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Timeline" |
*
* @param {Effect_Timeline_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_title: ((inputs?: Effect_Timeline_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Track {number}" |
*
* @param {Effect_Timeline_TrackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_track: ((inputs: Effect_Timeline_TrackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_TrackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} track" |
* | * | "{count} tracks" |
*
* @param {Effect_Timeline_Track_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_track_count: ((inputs: Effect_Timeline_Track_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Track_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Tracks" |
*
* @param {Effect_Timeline_TracksInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_tracks: ((inputs?: Effect_Timeline_TracksInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_TracksInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Transition (ms)" |
*
* @param {Effect_Timeline_TransitionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_transition: ((inputs?: Effect_Timeline_TransitionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_TransitionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Transition in milliseconds" |
*
* @param {Effect_Timeline_Transition_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_transition_aria: ((inputs?: Effect_Timeline_Transition_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Transition_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Transition max (ms)" |
*
* @param {Effect_Timeline_Transition_MaxInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_transition_max: ((inputs?: Effect_Timeline_Transition_MaxInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Transition_MaxInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Transition maximum in milliseconds" |
*
* @param {Effect_Timeline_Transition_Max_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_transition_max_aria: ((inputs?: Effect_Timeline_Transition_Max_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Transition_Max_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Transition min (ms)" |
*
* @param {Effect_Timeline_Transition_MinInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_transition_min: ((inputs?: Effect_Timeline_Transition_MinInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Transition_MinInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Transition minimum in milliseconds" |
*
* @param {Effect_Timeline_Transition_Min_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_transition_min_aria: ((inputs?: Effect_Timeline_Transition_Min_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Transition_Min_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Zoom in" |
*
* @param {Effect_Timeline_Zoom_InInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_zoom_in: ((inputs?: Effect_Timeline_Zoom_InInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Zoom_InInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Zoom out" |
*
* @param {Effect_Timeline_Zoom_OutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_timeline_zoom_out: ((inputs?: Effect_Timeline_Zoom_OutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Timeline_Zoom_OutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clip start must be zero or positive" |
*
* @param {Effect_Validation_Clip_Start_NegativeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_validation_clip_start_negative: ((inputs?: Effect_Validation_Clip_Start_NegativeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Validation_Clip_Start_NegativeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clip configuration is invalid" |
*
* @param {Effect_Validation_Config_InvalidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_validation_config_invalid: ((inputs?: Effect_Validation_Config_InvalidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Validation_Config_InvalidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Duration must be zero or positive" |
*
* @param {Effect_Validation_Duration_NegativeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_validation_duration_negative: ((inputs?: Effect_Validation_Duration_NegativeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Validation_Duration_NegativeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a name" |
*
* @param {Effect_Validation_Name_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_validation_name_required: ((inputs?: Effect_Validation_Name_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Validation_Name_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a Zigbee effect" |
*
* @param {Effect_Validation_Native_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_validation_native_required: ((inputs?: Effect_Validation_Native_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Validation_Native_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clips on a track cannot overlap" |
*
* @param {Effect_Validation_OverlapInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_validation_overlap: ((inputs?: Effect_Validation_OverlapInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Validation_OverlapInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clip extends past the loop end" |
*
* @param {Effect_Validation_Past_LoopInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_validation_past_loop: ((inputs?: Effect_Validation_Past_LoopInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Validation_Past_LoopInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clip transition bounds are invalid" |
*
* @param {Effect_Validation_Transition_InvalidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effect_validation_transition_invalid: ((inputs?: Effect_Validation_Transition_InvalidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effect_Validation_Transition_InvalidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Created by" |
*
* @param {Effects_Column_Created_ByInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_column_created_by: ((inputs?: Effects_Column_Created_ByInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Column_Created_ByInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Details" |
*
* @param {Effects_Column_DetailsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_column_details: ((inputs?: Effects_Column_DetailsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Column_DetailsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Effects_Column_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_column_name: ((inputs?: Effects_Column_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Column_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Uses" |
*
* @param {Effects_Column_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_column_required: ((inputs?: Effects_Column_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Column_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Source" |
*
* @param {Effects_Column_SourceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_column_source: ((inputs?: Effects_Column_SourceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Column_SourceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create effect" |
*
* @param {Effects_CreateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_create: ((inputs?: Effects_CreateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_CreateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Give your new effect a name. You can add steps in the editor." |
*
* @param {Effects_Create_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_create_description: ((inputs?: Effects_Create_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Create_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create your first effect" |
*
* @param {Effects_Create_FirstInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_create_first: ((inputs?: Effects_Create_FirstInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Create_FirstInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create more" |
*
* @param {Effects_Create_MoreInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_create_more: ((inputs?: Effects_Create_MoreInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Create_MoreInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create" |
*
* @param {Effects_Create_ShortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_create_short: ((inputs?: Effects_Create_ShortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Create_ShortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Creating…" |
*
* @param {Effects_CreatingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_creating: ((inputs?: Effects_CreatingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_CreatingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete “{name}”? This cannot be undone. Scenes and automations referencing this effect will need to be updated." |
*
* @param {Effects_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_delete_description: ((inputs: Effects_Delete_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Delete_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This permanently deletes the selected effects. Scenes and automations referencing them will need to be updated." |
*
* @param {Effects_Delete_Many_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_delete_many_description: ((inputs?: Effects_Delete_Many_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Delete_Many_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Delete {count} effect?" |
* | * | "Delete {count} effects?" |
*
* @param {Effects_Delete_Many_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_delete_many_title: ((inputs: Effects_Delete_Many_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Delete_Many_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete effect" |
*
* @param {Effects_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_delete_title: ((inputs?: Effects_Delete_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Delete_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit effect" |
*
* @param {Effects_EditInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_edit: ((inputs?: Effects_EditInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_EditInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No effects yet." |
*
* @param {Effects_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_empty: ((inputs?: Effects_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create a Hive effect, or pair a device that exposes Zigbee effects." |
*
* @param {Effects_Empty_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_empty_help: ((inputs?: Effects_Empty_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Empty_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not create the effect." |
*
* @param {Effects_Error_CreateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_error_create: ((inputs?: Effects_Error_CreateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Error_CreateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the effect." |
*
* @param {Effects_Error_DeleteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_error_delete: ((inputs?: Effects_Error_DeleteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Error_DeleteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the effects." |
*
* @param {Effects_Error_Delete_ManyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_error_delete_many: ((inputs?: Effects_Error_Delete_ManyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Error_Delete_ManyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not change the icon." |
*
* @param {Effects_Error_IconInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_error_icon: ((inputs?: Effects_Error_IconInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Error_IconInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not rename the effect." |
*
* @param {Effects_Error_RenameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_error_rename: ((inputs?: Effects_Error_RenameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Error_RenameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Hive effects" |
*
* @param {Effects_Hive_GroupInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_hive_group: ((inputs?: Effects_Hive_GroupInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Hive_GroupInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Kind" |
*
* @param {Effects_KindInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_kind: ((inputs?: Effects_KindInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_KindInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Loop" |
*
* @param {Effects_LoopInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_loop: ((inputs?: Effects_LoopInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_LoopInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Managed by Zigbee2MQTT" |
*
* @param {Effects_Managed_ZigbeeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_managed_zigbee: ((inputs?: Effects_Managed_ZigbeeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Managed_ZigbeeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect name" |
*
* @param {Effects_Name_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_name_placeholder: ((inputs?: Effects_Name_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Name_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No devices report any Zigbee effects yet." |
*
* @param {Effects_Native_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_native_empty: ((inputs?: Effects_Native_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Native_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not load Zigbee effects." |
*
* @param {Effects_Native_Load_ErrorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_native_load_error: ((inputs?: Effects_Native_Load_ErrorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Native_Load_ErrorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Loading available effects…" |
*
* @param {Effects_Native_LoadingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_native_loading: ((inputs?: Effects_Native_LoadingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Native_LoadingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect requested, but no device confirmed it" |
*
* @param {Effects_No_ConfirmationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_no_confirmation: ((inputs?: Effects_No_ConfirmationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_No_ConfirmationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No effects match your filters." |
*
* @param {Effects_No_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_no_match: ((inputs?: Effects_No_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_No_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No capabilities used" |
*
* @param {Effects_No_Required_CapabilitiesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_no_required_capabilities: ((inputs?: Effects_No_Required_CapabilitiesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_No_Required_CapabilitiesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Once" |
*
* @param {Effects_OnceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_once: ((inputs?: Effects_OnceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_OnceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose an effect to run on this device." |
*
* @param {Effects_Picker_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_picker_description: ((inputs?: Effects_Picker_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Picker_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick effect" |
*
* @param {Effects_Picker_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_picker_title: ((inputs?: Effects_Picker_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Picker_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Run effect" |
*
* @param {Effects_RunInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_run: ((inputs?: Effects_RunInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_RunInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a device, group, or room to run this effect on." |
*
* @param {Effects_Run_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_run_description: ((inputs?: Effects_Run_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Run_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Run Zigbee effect" |
*
* @param {Effects_Run_ZigbeeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_run_zigbee: ((inputs?: Effects_Run_ZigbeeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Run_ZigbeeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search effects…" |
*
* @param {Effects_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_search: ((inputs?: Effects_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select {name}" |
*
* @param {Effects_SelectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_select: ((inputs: Effects_SelectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_SelectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select an effect" |
*
* @param {Effects_Select_EffectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_select_effect: ((inputs?: Effects_Select_EffectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Select_EffectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Source" |
*
* @param {Effects_SourceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_source: ((inputs?: Effects_SourceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_SourceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not start the effect." |
*
* @param {Effects_Start_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_start_failed: ((inputs?: Effects_Start_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Start_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect started" |
*
* @param {Effects_StartedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_started: ((inputs?: Effects_StartedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_StartedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Effect started on {count} device" |
* | * | "Effect started on {count} devices" |
*
* @param {Effects_Started_DevicesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_started_devices: ((inputs: Effects_Started_DevicesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Started_DevicesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect started on {confirmed} of {total} devices" |
*
* @param {Effects_Started_PartialInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_started_partial: ((inputs: Effects_Started_PartialInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Started_PartialInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | tracksPlural | clipsPlural | output |
* | --- | --- | --- |
* | "one" | "one" | "{mode} · {tracks} track · {clips} clip" |
* | * | "one" | "{mode} · {tracks} tracks · {clips} clip" |
* | "one" | * | "{mode} · {tracks} track · {clips} clips" |
* | * | * | "{mode} · {tracks} tracks · {clips} clips" |
*
* @param {Effects_SummaryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_summary: ((inputs: Effects_SummaryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_SummaryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Confirmed" |
*
* @param {Effects_Support_ConfirmedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_support_confirmed: ((inputs?: Effects_Support_ConfirmedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Support_ConfirmedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unsupported" |
*
* @param {Effects_Support_UnsupportedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_support_unsupported: ((inputs?: Effects_Support_UnsupportedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Support_UnsupportedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Untested" |
*
* @param {Effects_Support_UntestedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_support_untested: ((inputs?: Effects_Support_UntestedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Support_UntestedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{count} supported" |
*
* @param {Effects_Supported_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_supported_count: ((inputs: Effects_Supported_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Supported_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect is unsupported on the selected target" |
*
* @param {Effects_Target_UnsupportedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_target_unsupported: ((inputs?: Effects_Target_UnsupportedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Target_UnsupportedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Timeline" |
*
* @param {Effects_TimelineInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_timeline: ((inputs?: Effects_TimelineInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_TimelineInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effects" |
*
* @param {Effects_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_title: ((inputs?: Effects_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{count} unconfirmed" |
*
* @param {Effects_Unconfirmed_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_unconfirmed_count: ((inputs: Effects_Unconfirmed_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Unconfirmed_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{count} unsupported" |
*
* @param {Effects_Unsupported_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_unsupported_count: ((inputs: Effects_Unsupported_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Unsupported_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Zigbee effect" |
*
* @param {Effects_Zigbee_EffectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_zigbee_effect: ((inputs?: Effects_Zigbee_EffectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Zigbee_EffectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Zigbee effects" |
*
* @param {Effects_Zigbee_GroupInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const effects_zigbee_group: ((inputs?: Effects_Zigbee_GroupInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Effects_Zigbee_GroupInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Actions for {name}" |
*
* @param {Entity_ActionsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const entity_actions: ((inputs: Entity_ActionsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Entity_ActionsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Tag rooms" |
*
* @param {Entity_Tag_RoomsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const entity_tag_rooms: ((inputs?: Entity_Tag_RoomsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Entity_Tag_RoomsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The username or password is incorrect." |
*
* @param {Error_Authentication_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_authentication_failed: ((inputs?: Error_Authentication_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_Authentication_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The request was invalid." |
*
* @param {Error_Bad_RequestInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_bad_request: ((inputs?: Error_Bad_RequestInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_Bad_RequestInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "That change conflicts with existing data." |
*
* @param {Error_ConflictInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_conflict: ((inputs?: Error_ConflictInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_ConflictInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Go back" |
*
* @param {Error_Go_BackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_go_back: ((inputs?: Error_Go_BackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_Go_BackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The bootstrap token is invalid." |
*
* @param {Error_Invalid_Bootstrap_TokenInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_invalid_bootstrap_token: ((inputs?: Error_Invalid_Bootstrap_TokenInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_Invalid_Bootstrap_TokenInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The requested item was not found." |
*
* @param {Error_Not_FoundInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_not_found: ((inputs?: Error_Not_FoundInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_Not_FoundInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "That page does not exist. It may have been deleted, or the link may be wrong." |
*
* @param {Error_Not_Found_DetailInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_not_found_detail: ((inputs?: Error_Not_Found_DetailInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_Not_Found_DetailInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Not found" |
*
* @param {Error_Not_Found_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_not_found_title: ((inputs?: Error_Not_Found_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_Not_Found_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The page could not be loaded. Try again, or head back to the dashboard." |
*
* @param {Error_Page_DetailInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_page_detail: ((inputs?: Error_Page_DetailInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_Page_DetailInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Something went wrong" |
*
* @param {Error_Page_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_page_title: ((inputs?: Error_Page_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_Page_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set a new password before continuing." |
*
* @param {Error_Password_Change_RequiredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_password_change_required: ((inputs?: Error_Password_Change_RequiredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_Password_Change_RequiredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Too many attempts. Try again in {seconds} seconds." |
*
* @param {Error_Rate_LimitedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_rate_limited: ((inputs: Error_Rate_LimitedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_Rate_LimitedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Please sign in to continue." |
*
* @param {Error_UnauthenticatedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_unauthenticated: ((inputs?: Error_UnauthenticatedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_UnauthenticatedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Check the entered values and try again." |
*
* @param {Error_ValidationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const error_validation: ((inputs?: Error_ValidationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Error_ValidationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Action" |
*
* @param {Field_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_action: ((inputs?: Field_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Availability" |
*
* @param {Field_AvailabilityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_availability: ((inputs?: Field_AvailabilityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_AvailabilityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Battery" |
*
* @param {Field_BatteryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_battery: ((inputs?: Field_BatteryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_BatteryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Breakdown" |
*
* @param {Field_BreakdownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_breakdown: ((inputs?: Field_BreakdownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_BreakdownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Brightness" |
*
* @param {Field_BrightnessInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_brightness: ((inputs?: Field_BrightnessInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_BrightnessInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Color" |
*
* @param {Field_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_color: ((inputs?: Field_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Color temperature" |
*
* @param {Field_Color_TemperatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_color_temperature: ((inputs?: Field_Color_TemperatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_Color_TemperatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Contact" |
*
* @param {Field_ContactInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_contact: ((inputs?: Field_ContactInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_ContactInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Created by" |
*
* @param {Field_Created_ByInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_created_by: ((inputs?: Field_Created_ByInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_Created_ByInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Current" |
*
* @param {Field_CurrentInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_current: ((inputs?: Field_CurrentInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_CurrentInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Deleted" |
*
* @param {Field_DeletedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_deleted: ((inputs?: Field_DeletedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_DeletedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device" |
*
* @param {Field_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_device: ((inputs?: Field_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device posture" |
*
* @param {Field_Device_PostureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_device_posture: ((inputs?: Field_Device_PostureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_Device_PostureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Disabled" |
*
* @param {Field_DisabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_disabled: ((inputs?: Field_DisabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_DisabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect" |
*
* @param {Field_EffectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_effect: ((inputs?: Field_EffectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_EffectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Empty" |
*
* @param {Field_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_empty: ((inputs?: Field_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enabled" |
*
* @param {Field_EnabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_enabled: ((inputs?: Field_EnabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_EnabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Energy" |
*
* @param {Field_EnergyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_energy: ((inputs?: Field_EnergyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_EnergyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Fan mode" |
*
* @param {Field_Fan_ModeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_fan_mode: ((inputs?: Field_Fan_ModeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_Fan_ModeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Humidity" |
*
* @param {Field_HumidityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_humidity: ((inputs?: Field_HumidityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_HumidityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "HVAC mode" |
*
* @param {Field_Hvac_ModeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_hvac_mode: ((inputs?: Field_Hvac_ModeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_Hvac_ModeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Illuminance" |
*
* @param {Field_IlluminanceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_illuminance: ((inputs?: Field_IlluminanceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_IlluminanceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last seen" |
*
* @param {Field_Last_SeenInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_last_seen: ((inputs?: Field_Last_SeenInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_Last_SeenInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Link quality" |
*
* @param {Field_Link_QualityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_link_quality: ((inputs?: Field_Link_QualityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_Link_QualityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Managed by" |
*
* @param {Field_Managed_ByInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_managed_by: ((inputs?: Field_Managed_ByInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_Managed_ByInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Members" |
*
* @param {Field_MembersInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_members: ((inputs?: Field_MembersInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_MembersInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Field_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_name: ((inputs?: Field_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "New" |
*
* @param {Field_NewInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_new: ((inputs?: Field_NewInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_NewInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Occupancy" |
*
* @param {Field_OccupancyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_occupancy: ((inputs?: Field_OccupancyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_OccupancyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Power" |
*
* @param {Field_OnInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_on: ((inputs?: Field_OnInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_OnInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Orientation" |
*
* @param {Field_OrientationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_orientation: ((inputs?: Field_OrientationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_OrientationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Power" |
*
* @param {Field_PowerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_power: ((inputs?: Field_PowerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_PowerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Power-on behavior" |
*
* @param {Field_Power_On_BehaviorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_power_on_behavior: ((inputs?: Field_Power_On_BehaviorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_Power_On_BehaviorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pressure" |
*
* @param {Field_PressureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_pressure: ((inputs?: Field_PressureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_PressureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rooms & groups" |
*
* @param {Field_Rooms_GroupsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_rooms_groups: ((inputs?: Field_Rooms_GroupsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_Rooms_GroupsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Source" |
*
* @param {Field_SourceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_source: ((inputs?: Field_SourceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_SourceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "State" |
*
* @param {Field_StateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_state: ((inputs?: Field_StateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_StateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Swing" |
*
* @param {Field_SwingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_swing: ((inputs?: Field_SwingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_SwingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Target temperature" |
*
* @param {Field_Target_TemperatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_target_temperature: ((inputs?: Field_Target_TemperatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_Target_TemperatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Temperature" |
*
* @param {Field_TemperatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_temperature: ((inputs?: Field_TemperatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_TemperatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Transition" |
*
* @param {Field_TransitionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_transition: ((inputs?: Field_TransitionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_TransitionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Type" |
*
* @param {Field_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_type: ((inputs?: Field_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Voltage" |
*
* @param {Field_VoltageInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const field_voltage: ((inputs?: Field_VoltageInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Field_VoltageInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add to group" |
*
* @param {Group_AddInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_add: ((inputs?: Group_AddInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_AddInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick one or more devices, groups, or rooms to add to this group." |
*
* @param {Group_Add_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_add_description: ((inputs?: Group_Add_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Add_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add members" |
*
* @param {Group_Add_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_add_generic: ((inputs?: Group_Add_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Add_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add members to {name}" |
*
* @param {Group_Add_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_add_named: ((inputs: Group_Add_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Add_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search for devices, groups, or rooms to add." |
*
* @param {Group_Add_Search_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_add_search_description: ((inputs?: Group_Add_Search_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Add_Search_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create group" |
*
* @param {Group_CreateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_create: ((inputs?: Group_CreateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_CreateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Give your new group a name. You can add members afterward." |
*
* @param {Group_Create_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_create_description: ((inputs?: Group_Create_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Create_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not create the group." |
*
* @param {Group_Create_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_create_failed: ((inputs?: Group_Create_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Create_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create your first group" |
*
* @param {Group_Create_FirstInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_create_first: ((inputs?: Group_Create_FirstInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Create_FirstInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create more" |
*
* @param {Group_Create_MoreInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_create_more: ((inputs?: Group_Create_MoreInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Create_MoreInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Creating…" |
*
* @param {Group_CreatingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_creating: ((inputs?: Group_CreatingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_CreatingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete group" |
*
* @param {Group_DeleteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_delete: ((inputs?: Group_DeleteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_DeleteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This action cannot be undone." |
*
* @param {Group_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_delete_description: ((inputs?: Group_Delete_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Delete_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the group." |
*
* @param {Group_Delete_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_delete_failed: ((inputs?: Group_Delete_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Delete_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This permanently deletes the selected groups and removes their memberships. This cannot be undone." |
*
* @param {Group_Delete_Many_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_delete_many_description: ((inputs?: Group_Delete_Many_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Delete_Many_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the groups." |
*
* @param {Group_Delete_Many_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_delete_many_failed: ((inputs?: Group_Delete_Many_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Delete_Many_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Delete {count} group?" |
* | * | "Delete {count} groups?" |
*
* @param {Group_Delete_Many_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_delete_many_title: ((inputs: Group_Delete_Many_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Delete_Many_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete “{name}”?" |
*
* @param {Group_Delete_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_delete_named: ((inputs: Group_Delete_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Delete_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit group" |
*
* @param {Group_EditInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_edit: ((inputs?: Group_EditInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_EditInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Group" |
*
* @param {Group_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_generic: ((inputs?: Group_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Managed by Zigbee2MQTT" |
*
* @param {Group_Managed_ZigbeeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_managed_zigbee: ((inputs?: Group_Managed_ZigbeeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Managed_ZigbeeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add member" |
*
* @param {Group_Member_AddInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_member_add: ((inputs?: Group_Member_AddInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Member_AddInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No members yet. Add devices or groups to this group." |
*
* @param {Group_Members_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_members_empty: ((inputs?: Group_Members_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Members_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No members." |
*
* @param {Group_Members_NoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_members_none: ((inputs?: Group_Members_NoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Members_NoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Group name" |
*
* @param {Group_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_name: ((inputs?: Group_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No groups match your filters." |
*
* @param {Group_No_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_no_match: ((inputs?: Group_No_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_No_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No groups yet." |
*
* @param {Group_NoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_none: ((inputs?: Group_NoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_NoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create a group to control devices together." |
*
* @param {Group_None_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_none_help: ((inputs?: Group_None_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_None_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not rename the group." |
*
* @param {Group_Rename_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_rename_failed: ((inputs?: Group_Rename_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Rename_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save the group." |
*
* @param {Group_Save_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_save_failed: ((inputs?: Group_Save_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Save_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search groups…" |
*
* @param {Group_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_search: ((inputs?: Group_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Tags" |
*
* @param {Group_TagsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_tags: ((inputs?: Group_TagsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_TagsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About group tags" |
*
* @param {Group_Tags_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_tags_about: ((inputs?: Group_Tags_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Tags_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Tags determine how this group appears on the dashboard." |
*
* @param {Group_Tags_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const group_tags_help: ((inputs?: Group_Tags_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Group_Tags_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No active guest was found with that name." |
*
* @param {Guest_Login_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guest_login_failed: ((inputs?: Guest_Login_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guest_Login_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Log out" |
*
* @param {Guest_LogoutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guest_logout: ((inputs?: Guest_LogoutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guest_LogoutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guest" |
*
* @param {Guest_Mode_GuestInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guest_mode_guest: ((inputs?: Guest_Mode_GuestInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guest_Mode_GuestInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "User" |
*
* @param {Guest_Mode_UserInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guest_mode_user: ((inputs?: Guest_Mode_UserInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guest_Mode_UserInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Guest_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guest_name: ((inputs?: Guest_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guest_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guest access" |
*
* @param {Guest_Sign_In_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guest_sign_in_title: ((inputs?: Guest_Sign_In_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guest_Sign_In_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This guest access has expired or was removed." |
*
* @param {Guest_UnavailableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guest_unavailable: ((inputs?: Guest_UnavailableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guest_UnavailableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add guest" |
*
* @param {Guests_AddInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_add: ((inputs?: Guests_AddInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_AddInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guest" |
*
* @param {Guests_Add_ShortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_add_short: ((inputs?: Guests_Add_ShortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_Add_ShortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guests sign in with their name and can use only the dashboard." |
*
* @param {Guests_Create_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_create_description: ((inputs?: Guests_Create_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_Create_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not add the guest." |
*
* @param {Guests_Create_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_create_failed: ((inputs?: Guests_Create_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_Create_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guest {name} added" |
*
* @param {Guests_CreatedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_created: ((inputs: Guests_CreatedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_CreatedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Custom" |
*
* @param {Guests_CustomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_custom: ((inputs?: Guests_CustomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_CustomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Duration" |
*
* @param {Guests_Custom_DurationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_custom_duration: ((inputs?: Guests_Custom_DurationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_Custom_DurationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Days" |
*
* @param {Guests_DaysInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_days: ((inputs?: Guests_DaysInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_DaysInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove {name}'s guest access immediately?" |
*
* @param {Guests_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_delete_description: ((inputs: Guests_Delete_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_Delete_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not remove the guest." |
*
* @param {Guests_Delete_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_delete_failed: ((inputs?: Guests_Delete_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_Delete_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove guest" |
*
* @param {Guests_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_delete_title: ((inputs?: Guests_Delete_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_Delete_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guest {name} removed" |
*
* @param {Guests_DeletedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_deleted: ((inputs: Guests_DeletedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_DeletedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Access for" |
*
* @param {Guests_DurationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_duration: ((inputs?: Guests_DurationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_DurationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Expires {time}" |
*
* @param {Guests_ExpiresInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_expires: ((inputs: Guests_ExpiresInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_ExpiresInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Extend access" |
*
* @param {Guests_ExtendInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_extend: ((inputs?: Guests_ExtendInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_ExtendInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add time to {name}'s current expiry." |
*
* @param {Guests_Extend_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_extend_description: ((inputs: Guests_Extend_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_Extend_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not extend the guest access." |
*
* @param {Guests_Extend_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_extend_failed: ((inputs?: Guests_Extend_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_Extend_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The expiry cannot be later than 7 days after the guest was created." |
*
* @param {Guests_Extend_MaximumInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_extend_maximum: ((inputs?: Guests_Extend_MaximumInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_Extend_MaximumInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Access extended for {name}" |
*
* @param {Guests_ExtendedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_extended: ((inputs: Guests_ExtendedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_ExtendedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "4 hours" |
*
* @param {Guests_Four_HoursInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_four_hours: ((inputs?: Guests_Four_HoursInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_Four_HoursInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Hours" |
*
* @param {Guests_HoursInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_hours: ((inputs?: Guests_HoursInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_HoursInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "1 day" |
*
* @param {Guests_One_DayInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_one_day: ((inputs?: Guests_One_DayInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_One_DayInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "1 hour" |
*
* @param {Guests_One_HourInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_one_hour: ((inputs?: Guests_One_HourInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_One_HourInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guest" |
*
* @param {Guests_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const guests_type: ((inputs?: Guests_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Guests_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "All series are hidden. Enable at least one below." |
*
* @param {History_All_HiddenInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_all_hidden: ((inputs?: History_All_HiddenInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_All_HiddenInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Dismiss reading" |
*
* @param {History_Dismiss_ReadingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_dismiss_reading: ((inputs?: History_Dismiss_ReadingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_Dismiss_ReadingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "End of history" |
*
* @param {History_EndInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_end: ((inputs?: History_EndInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_EndInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last {count} hours" |
*
* @param {History_Last_HoursInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_last_hours: ((inputs: History_Last_HoursInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_Last_HoursInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not load history." |
*
* @param {History_Load_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_load_failed: ((inputs?: History_Load_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_Load_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Loading more…" |
*
* @param {History_Loading_MoreInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_loading_more: ((inputs?: History_Loading_MoreInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_Loading_MoreInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No samples in the selected range." |
*
* @param {History_No_SamplesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_no_samples: ((inputs?: History_No_SamplesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_No_SamplesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Resolution" |
*
* @param {History_ResolutionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_resolution: ((inputs?: History_ResolutionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_ResolutionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Auto" |
*
* @param {History_Resolution_AutoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_resolution_auto: ((inputs?: History_Resolution_AutoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_Resolution_AutoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} day" |
* | * | "{count} days" |
*
* @param {History_Resolution_DaysInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_resolution_days: ((inputs: History_Resolution_DaysInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_Resolution_DaysInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} hour" |
* | * | "{count} hours" |
*
* @param {History_Resolution_HoursInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_resolution_hours: ((inputs: History_Resolution_HoursInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_Resolution_HoursInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} minute" |
* | * | "{count} minutes" |
*
* @param {History_Resolution_MinutesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_resolution_minutes: ((inputs: History_Resolution_MinutesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_Resolution_MinutesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unknown before the first recorded state" |
*
* @param {History_Unknown_Before_FirstInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_unknown_before_first: ((inputs?: History_Unknown_Before_FirstInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_Unknown_Before_FirstInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "View more" |
*
* @param {History_View_MoreInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const history_view_more: ((inputs?: History_View_MoreInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<History_View_MoreInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Change icon" |
*
* @param {Icon_ChangeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const icon_change: ((inputs?: Icon_ChangeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Icon_ChangeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not change the icon." |
*
* @param {Icon_Change_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const icon_change_failed: ((inputs?: Icon_Change_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Icon_Change_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear icon" |
*
* @param {Icon_ClearInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const icon_clear: ((inputs?: Icon_ClearInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Icon_ClearInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No icons found." |
*
* @param {Icon_NoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const icon_none: ((inputs?: Icon_NoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Icon_NoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search icons…" |
*
* @param {Icon_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const icon_search: ((inputs?: Icon_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Icon_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Type to search icons." |
*
* @param {Icon_Search_PromptInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const icon_search_prompt: ((inputs?: Icon_Search_PromptInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Icon_Search_PromptInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add integration" |
*
* @param {Integrations_AddInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_add: ((inputs?: Integrations_AddInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_AddInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick an integration to configure." |
*
* @param {Integrations_Add_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_add_description: ((inputs?: Integrations_Add_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Add_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add" |
*
* @param {Integrations_Add_ShortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_add_short: ((inputs?: Integrations_Add_ShortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Add_ShortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Configure" |
*
* @param {Integrations_ConfigureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_configure: ((inputs?: Integrations_ConfigureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_ConfigureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete integration" |
*
* @param {Integrations_DeleteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_delete: ((inputs?: Integrations_DeleteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_DeleteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Deleting this integration removes its configuration and disconnects it. Its devices are kept, and reconfiguring it later restores them." |
*
* @param {Integrations_Delete_Keep_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_delete_keep_description: ((inputs?: Integrations_Delete_Keep_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Delete_Keep_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Deleting this integration removes its configuration and all devices connected through it. This cannot be undone." |
*
* @param {Integrations_Delete_Purge_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_delete_purge_description: ((inputs?: Integrations_Delete_Purge_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Delete_Purge_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete integration" |
*
* @param {Integrations_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_delete_title: ((inputs?: Integrations_Delete_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Delete_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device adapter" |
*
* @param {Integrations_Description_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_description_generic: ((inputs?: Integrations_Description_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Description_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cloud API device adapter" |
*
* @param {Integrations_Description_TuyaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_description_tuya: ((inputs?: Integrations_Description_TuyaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Description_TuyaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Zigbee devices via an MQTT bridge" |
*
* @param {Integrations_Description_Zigbee2mqttInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_description_zigbee2mqtt: ((inputs?: Integrations_Description_Zigbee2mqttInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Description_Zigbee2mqttInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "This will delete {count} device." |
* | * | "This will delete {count} devices." |
*
* @param {Integrations_Devices_DeletedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_devices_deleted: ((inputs: Integrations_Devices_DeletedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Devices_DeletedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} device will be kept and marked unavailable." |
* | * | "{count} devices will be kept and marked unavailable." |
*
* @param {Integrations_Devices_KeptInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_devices_kept: ((inputs: Integrations_Devices_KeptInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Devices_KeptInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No integrations yet." |
*
* @param {Integrations_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_empty: ((inputs?: Integrations_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add an integration to bring external devices into Saffron Hive." |
*
* @param {Integrations_Empty_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_empty_help: ((inputs?: Integrations_Empty_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Empty_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No integrations match your search." |
*
* @param {Integrations_No_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_no_match: ((inputs?: Integrations_No_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_No_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No integrations left to add." |
*
* @param {Integrations_None_AvailableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_none_available: ((inputs?: Integrations_None_AvailableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_None_AvailableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search integrations…" |
*
* @param {Integrations_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_search: ((inputs?: Integrations_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Configured" |
*
* @param {Integrations_Status_ConfiguredInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_status_configured: ((inputs?: Integrations_Status_ConfiguredInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Status_ConfiguredInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Connected" |
*
* @param {Integrations_Status_ConnectedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_status_connected: ((inputs?: Integrations_Status_ConnectedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Status_ConnectedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Disabled" |
*
* @param {Integrations_Status_DisabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const integrations_status_disabled: ((inputs?: Integrations_Status_DisabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Integrations_Status_DisabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "English" |
*
* @param {Language_EnglishInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const language_english: ((inputs?: Language_EnglishInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Language_EnglishInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Russian" |
*
* @param {Language_RussianInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const language_russian: ((inputs?: Language_RussianInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Language_RussianInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Swedish" |
*
* @param {Language_SwedishInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const language_swedish: ((inputs?: Language_SwedishInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Language_SwedishInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | totalPlural | output |
* | --- | --- |
* | "one" | "{on} of {total} light" |
* | * | "{on} of {total} lights" |
*
* @param {Lights_On_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const lights_on_count: ((inputs: Lights_On_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Lights_On_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Live" |
*
* @param {Logs_LiveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const logs_live: ((inputs?: Logs_LiveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Logs_LiveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Paused" |
*
* @param {Logs_PausedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const logs_paused: ((inputs?: Logs_PausedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Logs_PausedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search logs…" |
*
* @param {Logs_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const logs_search: ((inputs?: Logs_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Logs_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Replace or recharge the battery" |
*
* @param {Maintenance_Battery_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_battery_action: ((inputs?: Maintenance_Battery_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Battery_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} battery is {value}%" |
*
* @param {Maintenance_Battery_DetailInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_battery_detail: ((inputs: Maintenance_Battery_DetailInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Battery_DetailInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Correct sensor placement" |
*
* @param {Maintenance_Correct_PostureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_correct_posture: ((inputs?: Maintenance_Correct_PostureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Correct_PostureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Nothing needs maintenance." |
*
* @param {Maintenance_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_empty: ((inputs?: Maintenance_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device" |
*
* @param {Maintenance_Filter_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_filter_device: ((inputs?: Maintenance_Filter_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Filter_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device type" |
*
* @param {Maintenance_Filter_Device_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_filter_device_type: ((inputs?: Maintenance_Filter_Device_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Filter_Device_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Maintenance" |
*
* @param {Maintenance_Filter_KindInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_filter_kind: ((inputs?: Maintenance_Filter_KindInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Filter_KindInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Status" |
*
* @param {Maintenance_Filter_StatusInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_filter_status: ((inputs?: Maintenance_Filter_StatusInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Filter_StatusInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Upgrade in Zigbee2MQTT" |
*
* @param {Maintenance_Firmware_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_firmware_action: ((inputs?: Maintenance_Firmware_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Firmware_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Firmware {version} is available for {name}" |
*
* @param {Maintenance_Firmware_DetailInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_firmware_detail: ((inputs: Maintenance_Firmware_DetailInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Firmware_DetailInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Free storage space" |
*
* @param {Maintenance_Free_StorageInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_free_storage: ((inputs?: Maintenance_Free_StorageInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Free_StorageInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Replace batteries" |
*
* @param {Maintenance_Group_BatteriesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_group_batteries: ((inputs?: Maintenance_Group_BatteriesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Group_BatteriesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Correct sensor placement" |
*
* @param {Maintenance_Group_PostureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_group_posture: ((inputs?: Maintenance_Group_PostureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Group_PostureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "System maintenance" |
*
* @param {Maintenance_Group_SystemInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_group_system: ((inputs?: Maintenance_Group_SystemInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Group_SystemInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Updates" |
*
* @param {Maintenance_Group_UpdatesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_group_updates: ((inputs?: Maintenance_Group_UpdatesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Group_UpdatesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Loading maintenance…" |
*
* @param {Maintenance_LoadingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_loading: ((inputs?: Maintenance_LoadingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_LoadingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Mark all done" |
*
* @param {Maintenance_Mark_All_DoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_mark_all_done: ((inputs?: Maintenance_Mark_All_DoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Mark_All_DoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Mark done" |
*
* @param {Maintenance_Mark_DoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_mark_done: ((inputs?: Maintenance_Mark_DoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Mark_DoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No maintenance matches your search." |
*
* @param {Maintenance_No_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_no_match: ((inputs?: Maintenance_No_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_No_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Open" |
*
* @param {Maintenance_OpenInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_open: ((inputs?: Maintenance_OpenInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_OpenInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Correct the sensor placement" |
*
* @param {Maintenance_Posture_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_posture_action: ((inputs?: Maintenance_Posture_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Posture_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} reports abnormal posture" |
*
* @param {Maintenance_Posture_DetailInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_posture_detail: ((inputs: Maintenance_Posture_DetailInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Posture_DetailInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Replace battery" |
*
* @param {Maintenance_Replace_BatteryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_replace_battery: ((inputs?: Maintenance_Replace_BatteryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Replace_BatteryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search maintenance…" |
*
* @param {Maintenance_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_search: ((inputs?: Maintenance_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Disabled" |
*
* @param {Maintenance_Status_DisabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_status_disabled: ((inputs?: Maintenance_Status_DisabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Status_DisabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Offline" |
*
* @param {Maintenance_Status_OfflineInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_status_offline: ((inputs?: Maintenance_Status_OfflineInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Status_OfflineInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Online" |
*
* @param {Maintenance_Status_OnlineInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_status_online: ((inputs?: Maintenance_Status_OnlineInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Status_OnlineInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "System" |
*
* @param {Maintenance_Status_SystemInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_status_system: ((inputs?: Maintenance_Status_SystemInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Status_SystemInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{path} has {value}% free" |
*
* @param {Maintenance_Storage_DetailInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_storage_detail: ((inputs: Maintenance_Storage_DetailInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Storage_DetailInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Color" |
*
* @param {Maintenance_Type_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_type_color: ((inputs?: Maintenance_Type_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Type_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Firmware" |
*
* @param {Maintenance_Type_FirmwareInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_type_firmware: ((inputs?: Maintenance_Type_FirmwareInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Type_FirmwareInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Posture" |
*
* @param {Maintenance_Type_PostureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_type_posture: ((inputs?: Maintenance_Type_PostureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Type_PostureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Storage" |
*
* @param {Maintenance_Type_StorageInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_type_storage: ((inputs?: Maintenance_Type_StorageInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Type_StorageInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Upgrade firmware" |
*
* @param {Maintenance_Upgrade_FirmwareInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_upgrade_firmware: ((inputs?: Maintenance_Upgrade_FirmwareInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_Upgrade_FirmwareInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "View device" |
*
* @param {Maintenance_View_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const maintenance_view_device: ((inputs?: Maintenance_View_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Maintenance_View_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add to the selection" |
*
* @param {Map_Add_SelectionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_add_selection: ((inputs?: Map_Add_SelectionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Add_SelectionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add to the selection (or hold Shift)" |
*
* @param {Map_Add_Selection_HintInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_add_selection_hint: ((inputs?: Map_Add_Selection_HintInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Add_Selection_HintInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Stop adding to the selection" |
*
* @param {Map_Add_Selection_StopInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_add_selection_stop: ((inputs?: Map_Add_Selection_StopInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Add_Selection_StopInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Attached" |
*
* @param {Map_AttachedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_attached: ((inputs?: Map_AttachedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_AttachedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Blocks light" |
*
* @param {Map_Blocks_LightInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_blocks_light: ((inputs?: Map_Blocks_LightInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Blocks_LightInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a custom brush value" |
*
* @param {Map_Brush_CustomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_brush_custom: ((inputs?: Map_Brush_CustomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Brush_CustomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Larger brush" |
*
* @param {Map_Brush_LargerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_brush_larger: ((inputs?: Map_Brush_LargerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Brush_LargerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No brush armed" |
*
* @param {Map_Brush_NoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_brush_none: ((inputs?: Map_Brush_NoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Brush_NoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Brush paints {value}" |
*
* @param {Map_Brush_PaintsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_brush_paints: ((inputs: Map_Brush_PaintsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Brush_PaintsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Smaller brush" |
*
* @param {Map_Brush_SmallerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_brush_smaller: ((inputs?: Map_Brush_SmallerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Brush_SmallerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Brush turns lights off" |
*
* @param {Map_Brush_Turns_OffInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_brush_turns_off: ((inputs?: Map_Brush_Turns_OffInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Brush_Turns_OffInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Brush turns lights on" |
*
* @param {Map_Brush_Turns_OnInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_brush_turns_on: ((inputs?: Map_Brush_Turns_OnInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Brush_Turns_OnInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear them as you go" |
*
* @param {Map_Clear_Measurements_As_You_GoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_clear_measurements_as_you_go: ((inputs?: Map_Clear_Measurements_As_You_GoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Clear_Measurements_As_You_GoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove and place" |
*
* @param {Map_Conflict_ConfirmInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_conflict_confirm: ((inputs?: Map_Conflict_ConfirmInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Conflict_ConfirmInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} covers these. They come off the map; nothing else changes." |
*
* @param {Map_Conflict_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_conflict_description: ((inputs: Map_Conflict_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Conflict_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "These markers leave the plan:" |
*
* @param {Map_Conflict_MarkersInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_conflict_markers: ((inputs?: Map_Conflict_MarkersInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Conflict_MarkersInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Already on the map" |
*
* @param {Map_Conflict_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_conflict_title: ((inputs?: Map_Conflict_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Conflict_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Copy selected walls" |
*
* @param {Map_Copy_Selected_WallsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_copy_selected_walls: ((inputs?: Map_Copy_Selected_WallsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Copy_Selected_WallsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Home" |
*
* @param {Map_Default_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_default_name: ((inputs?: Map_Default_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Default_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete room" |
*
* @param {Map_Delete_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_delete_room: ((inputs?: Map_Delete_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Delete_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Detach sensor" |
*
* @param {Map_Detach_SensorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_detach_sensor: ((inputs?: Map_Detach_SensorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Detach_SensorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Detach the sensor before changing or removing this door." |
*
* @param {Map_Detach_Sensor_FirstInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_detach_sensor_first: ((inputs?: Map_Detach_Sensor_FirstInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Detach_Sensor_FirstInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Detached rooms" |
*
* @param {Map_Detached_RoomsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_detached_rooms: ((inputs?: Map_Detached_RoomsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Detached_RoomsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} device" |
* | * | "{count} devices" |
*
* @param {Map_Device_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_device_count: ((inputs: Map_Device_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Device_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{placed} of {total} devices placed" |
*
* @param {Map_Devices_PlacedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_devices_placed: ((inputs: Map_Devices_PlacedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Devices_PlacedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Discard" |
*
* @param {Map_DiscardInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_discard: ((inputs?: Map_DiscardInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_DiscardInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Your unsaved changes to the plan will be lost." |
*
* @param {Map_Discard_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_discard_description: ((inputs?: Map_Discard_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Discard_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Discard detached room" |
*
* @param {Map_Discard_Detached_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_discard_detached_room: ((inputs?: Map_Discard_Detached_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Discard_Detached_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Discard changes?" |
*
* @param {Map_Discard_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_discard_title: ((inputs?: Map_Discard_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Discard_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Door already has a sensor" |
*
* @param {Map_Door_Sensor_ConflictInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_door_sensor_conflict: ((inputs?: Map_Door_Sensor_ConflictInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Door_Sensor_ConflictInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Drag a device or group onto the plan." |
*
* @param {Map_Drag_Device_GroupInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_drag_device_group: ((inputs?: Map_Drag_Device_GroupInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Drag_Device_GroupInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Duplicate" |
*
* @param {Map_DuplicateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_duplicate: ((inputs?: Map_DuplicateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_DuplicateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Floor plan editor" |
*
* @param {Map_Editor_LabelInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_editor_label: ((inputs?: Map_Editor_LabelInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Editor_LabelInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No plan yet." |
*
* @param {Map_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_empty: ((inputs?: Map_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick the wall tool and click to start drawing." |
*
* @param {Map_Empty_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_empty_help: ((inputs?: Map_Empty_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Empty_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not apply the scene." |
*
* @param {Map_Error_Apply_SceneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_error_apply_scene: ((inputs?: Map_Error_Apply_SceneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Error_Apply_SceneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save the display color." |
*
* @param {Map_Error_Display_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_error_display_color: ((inputs?: Map_Error_Display_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Error_Display_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save the plan." |
*
* @param {Map_Error_SaveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_error_save: ((inputs?: Map_Error_SaveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Error_SaveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not stop the scene." |
*
* @param {Map_Error_Stop_SceneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_error_stop_scene: ((inputs?: Map_Error_Stop_SceneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Error_Stop_SceneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Flip hinge" |
*
* @param {Map_Flip_HingeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_flip_hinge: ((inputs?: Map_Flip_HingeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Flip_HingeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Flip swing side" |
*
* @param {Map_Flip_SwingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_flip_swing: ((inputs?: Map_Flip_SwingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Flip_SwingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Frame the whole plan" |
*
* @param {Map_Frame_PlanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_frame_plan: ((inputs?: Map_Frame_PlanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Frame_PlanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Furniture" |
*
* @param {Map_FurnitureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture: ((inputs?: Map_FurnitureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_FurnitureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Armchair" |
*
* @param {Map_Furniture_ArmchairInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_armchair: ((inputs?: Map_Furniture_ArmchairInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_ArmchairInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Bathtub" |
*
* @param {Map_Furniture_BathtubInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_bathtub: ((inputs?: Map_Furniture_BathtubInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_BathtubInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Double bed" |
*
* @param {Map_Furniture_Bed_DoubleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_bed_double: ((inputs?: Map_Furniture_Bed_DoubleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_Bed_DoubleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Small double bed" |
*
* @param {Map_Furniture_Bed_MediumInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_bed_medium: ((inputs?: Map_Furniture_Bed_MediumInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_Bed_MediumInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Single bed" |
*
* @param {Map_Furniture_Bed_SingleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_bed_single: ((inputs?: Map_Furniture_Bed_SingleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_Bed_SingleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Box" |
*
* @param {Map_Furniture_BoxInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_box: ((inputs?: Map_Furniture_BoxInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_BoxInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Drag a piece onto the plan. It arrives at its real size." |
*
* @param {Map_Furniture_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_description: ((inputs?: Map_Furniture_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Ellipse" |
*
* @param {Map_Furniture_EllipseInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_ellipse: ((inputs?: Map_Furniture_EllipseInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_EllipseInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Beds" |
*
* @param {Map_Furniture_Group_BedsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_group_beds: ((inputs?: Map_Furniture_Group_BedsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_Group_BedsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Fixtures" |
*
* @param {Map_Furniture_Group_FixturesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_group_fixtures: ((inputs?: Map_Furniture_Group_FixturesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_Group_FixturesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Shapes" |
*
* @param {Map_Furniture_Group_ShapesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_group_shapes: ((inputs?: Map_Furniture_Group_ShapesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_Group_ShapesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sofas" |
*
* @param {Map_Furniture_Group_SofasInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_group_sofas: ((inputs?: Map_Furniture_Group_SofasInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_Group_SofasInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sink" |
*
* @param {Map_Furniture_SinkInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_sink: ((inputs?: Map_Furniture_SinkInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_SinkInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sofa" |
*
* @param {Map_Furniture_SofaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_sofa: ((inputs?: Map_Furniture_SofaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_SofaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sofa center" |
*
* @param {Map_Furniture_Sofa_CenterInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_sofa_center: ((inputs?: Map_Furniture_Sofa_CenterInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_Sofa_CenterInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sofa corner" |
*
* @param {Map_Furniture_Sofa_CornerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_sofa_corner: ((inputs?: Map_Furniture_Sofa_CornerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_Sofa_CornerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sofa side" |
*
* @param {Map_Furniture_Sofa_SideInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_sofa_side: ((inputs?: Map_Furniture_Sofa_SideInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_Sofa_SideInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Toilet" |
*
* @param {Map_Furniture_ToiletInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_furniture_toilet: ((inputs?: Map_Furniture_ToiletInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Furniture_ToiletInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Go to device" |
*
* @param {Map_Go_To_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_go_to_device: ((inputs?: Map_Go_To_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Go_To_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Go to group" |
*
* @param {Map_Go_To_GroupInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_go_to_group: ((inputs?: Map_Go_To_GroupInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Go_To_GroupInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Hide neighbour links" |
*
* @param {Map_Hide_Neighbour_LinksInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_hide_neighbour_links: ((inputs?: Map_Hide_Neighbour_LinksInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Hide_Neighbour_LinksInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Hide {provider} mesh" |
*
* @param {Map_Hide_Provider_MeshInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_hide_provider_mesh: ((inputs: Map_Hide_Provider_MeshInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Hide_Provider_MeshInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} sits inside this piece" |
*
* @param {Map_Inside_PieceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_inside_piece: ((inputs: Map_Inside_PieceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Inside_PieceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Keep corners square" |
*
* @param {Map_Keep_Corners_SquareInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_keep_corners_square: ((inputs?: Map_Keep_Corners_SquareInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Keep_Corners_SquareInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Keep measurements on the plan" |
*
* @param {Map_Keep_MeasurementsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_keep_measurements: ((inputs?: Map_Keep_MeasurementsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Keep_MeasurementsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Lets light through" |
*
* @param {Map_Lets_Light_ThroughInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_lets_light_through: ((inputs?: Map_Lets_Light_ThroughInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Lets_Light_ThroughInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Link a Hive room" |
*
* @param {Map_Link_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_link_room: ((inputs?: Map_Link_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Link_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Drag a room onto the plan, or select it to stamp a linked room." |
*
* @param {Map_Link_Room_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_link_room_description: ((inputs?: Map_Link_Room_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Link_Room_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Link room" |
*
* @param {Map_Link_Room_ShortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_link_room_short: ((inputs?: Map_Link_Room_ShortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Link_Room_ShortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Linked" |
*
* @param {Map_LinkedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_linked: ((inputs?: Map_LinkedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_LinkedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Lock room" |
*
* @param {Map_Lock_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_lock_room: ((inputs?: Map_Lock_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Lock_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Mesh scanned {time}" |
*
* @param {Map_Mesh_ScannedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_mesh_scanned: ((inputs: Map_Mesh_ScannedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Mesh_ScannedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Move corners freely" |
*
* @param {Map_Move_Corners_FreelyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_move_corners_freely: ((inputs?: Map_Move_Corners_FreelyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Move_Corners_FreelyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} and {count} more" |
*
* @param {Map_Named_And_MoreInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_named_and_more: ((inputs: Map_Named_And_MoreInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Named_And_MoreInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No devices in this room." |
*
* @param {Map_No_Devices_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_no_devices_room: ((inputs?: Map_No_Devices_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_No_Devices_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Nothing copied yet" |
*
* @param {Map_Nothing_CopiedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_nothing_copied: ((inputs?: Map_Nothing_CopiedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Nothing_CopiedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Open device" |
*
* @param {Map_Open_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_open_device: ((inputs?: Map_Open_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Open_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Paint brush" |
*
* @param {Map_Paint_BrushInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_paint_brush: ((inputs?: Map_Paint_BrushInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Paint_BrushInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Paint color {value}" |
*
* @param {Map_Paint_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_paint_color: ((inputs: Map_Paint_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Paint_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Paint lights off" |
*
* @param {Map_Paint_Lights_OffInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_paint_lights_off: ((inputs?: Map_Paint_Lights_OffInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Paint_Lights_OffInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Paint lights on" |
*
* @param {Map_Paint_Lights_OnInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_paint_lights_on: ((inputs?: Map_Paint_Lights_OnInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Paint_Lights_OnInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Paint white temperature {value} mireds" |
*
* @param {Map_Paint_TemperatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_paint_temperature: ((inputs: Map_Paint_TemperatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Paint_TemperatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Paste copied walls" |
*
* @param {Map_Paste_Copied_WallsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_paste_copied_walls: ((inputs?: Map_Paste_Copied_WallsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Paste_Copied_WallsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Placed" |
*
* @param {Map_PlacedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_placed: ((inputs?: Map_PlacedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_PlacedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Redo" |
*
* @param {Map_RedoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_redo: ((inputs?: Map_RedoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_RedoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove and attach" |
*
* @param {Map_Remove_AttachInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_remove_attach: ((inputs?: Map_Remove_AttachInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Remove_AttachInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove from map" |
*
* @param {Map_Remove_From_MapInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_remove_from_map: ((inputs?: Map_Remove_From_MapInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Remove_From_MapInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove from plan" |
*
* @param {Map_Remove_From_PlanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_remove_from_plan: ((inputs?: Map_Remove_From_PlanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Remove_From_PlanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove opening" |
*
* @param {Map_Remove_OpeningInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_remove_opening: ((inputs?: Map_Remove_OpeningInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Remove_OpeningInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rename" |
*
* @param {Map_RenameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_rename: ((inputs?: Map_RenameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_RenameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Replace and attach" |
*
* @param {Map_Replace_AttachInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_replace_attach: ((inputs?: Map_Replace_AttachInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Replace_AttachInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Room" |
*
* @param {Map_Room_FallbackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_room_fallback: ((inputs?: Map_Room_FallbackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Room_FallbackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Room label" |
*
* @param {Map_Room_Label_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_room_label_placeholder: ((inputs?: Map_Room_Label_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Room_Label_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rooms" |
*
* @param {Map_RoomsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_rooms: ((inputs?: Map_RoomsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_RoomsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select walls to copy" |
*
* @param {Map_Select_Walls_To_CopyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_select_walls_to_copy: ((inputs?: Map_Select_Walls_To_CopyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Select_Walls_To_CopyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Attaching this sensor removes the conflicting map representation." |
*
* @param {Map_Sensor_Conflict_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_sensor_conflict_description: ((inputs?: Map_Sensor_Conflict_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Sensor_Conflict_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set display color" |
*
* @param {Map_Set_Display_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_set_display_color: ((inputs?: Map_Set_Display_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Set_Display_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Show neighbour links" |
*
* @param {Map_Show_Neighbour_LinksInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_show_neighbour_links: ((inputs?: Map_Show_Neighbour_LinksInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Show_Neighbour_LinksInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Show {provider} mesh" |
*
* @param {Map_Show_Provider_MeshInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_show_provider_mesh: ((inputs: Map_Show_Provider_MeshInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Show_Provider_MeshInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Snap to the grid and to walls" |
*
* @param {Map_Snap_LabelInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_snap_label: ((inputs?: Map_Snap_LabelInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Snap_LabelInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Turn snapping off (or hold Alt)" |
*
* @param {Map_Snap_OffInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_snap_off: ((inputs?: Map_Snap_OffInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Snap_OffInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Turn snapping on" |
*
* @param {Map_Snap_OnInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_snap_on: ((inputs?: Map_Snap_OnInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Snap_OnInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Thickness" |
*
* @param {Map_ThicknessInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_thickness: ((inputs?: Map_ThicknessInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_ThicknessInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Map" |
*
* @param {Map_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_title: ((inputs?: Map_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Area" |
*
* @param {Map_Tool_AreaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_area: ((inputs?: Map_Tool_AreaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_AreaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cased opening" |
*
* @param {Map_Tool_Cased_OpeningInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_cased_opening: ((inputs?: Map_Tool_Cased_OpeningInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_Cased_OpeningInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cut an opening" |
*
* @param {Map_Tool_Cut_OpeningInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_cut_opening: ((inputs?: Map_Tool_Cut_OpeningInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_Cut_OpeningInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Door" |
*
* @param {Map_Tool_DoorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_door: ((inputs?: Map_Tool_DoorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_DoorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Draw walls" |
*
* @param {Map_Tool_Draw_WallsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_draw_walls: ((inputs?: Map_Tool_Draw_WallsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_Draw_WallsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Length" |
*
* @param {Map_Tool_LengthInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_length: ((inputs?: Map_Tool_LengthInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_LengthInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Measure" |
*
* @param {Map_Tool_MeasureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_measure: ((inputs?: Map_Tool_MeasureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_MeasureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Move" |
*
* @param {Map_Tool_MoveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_move: ((inputs?: Map_Tool_MoveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_MoveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Resize" |
*
* @param {Map_Tool_ResizeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_resize: ((inputs?: Map_Tool_ResizeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_ResizeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rotate" |
*
* @param {Map_Tool_RotateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_rotate: ((inputs?: Map_Tool_RotateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_RotateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select" |
*
* @param {Map_Tool_SelectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_select: ((inputs?: Map_Tool_SelectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_SelectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Stamp a room" |
*
* @param {Map_Tool_Stamp_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_stamp_room: ((inputs?: Map_Tool_Stamp_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_Stamp_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Window" |
*
* @param {Map_Tool_WindowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_tool_window: ((inputs?: Map_Tool_WindowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Tool_WindowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Undo" |
*
* @param {Map_UndoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_undo: ((inputs?: Map_UndoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_UndoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unlink room" |
*
* @param {Map_Unlink_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_unlink_room: ((inputs?: Map_Unlink_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Unlink_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unlock room" |
*
* @param {Map_Unlock_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_unlock_room: ((inputs?: Map_Unlock_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Unlock_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Connectivity" |
*
* @param {Map_View_ConnectivityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_view_connectivity: ((inputs?: Map_View_ConnectivityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_View_ConnectivityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Light" |
*
* @param {Map_View_LightInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_view_light: ((inputs?: Map_View_LightInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_View_LightInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Map view" |
*
* @param {Map_View_PickerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_view_picker: ((inputs?: Map_View_PickerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_View_PickerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Temperature" |
*
* @param {Map_View_TemperatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_view_temperature: ((inputs?: Map_View_TemperatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_View_TemperatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Wall thickness in meters" |
*
* @param {Map_Wall_Thickness_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const map_wall_thickness_aria: ((inputs?: Map_Wall_Thickness_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Map_Wall_Thickness_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not add the member." |
*
* @param {Member_Add_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const member_add_failed: ((inputs?: Member_Add_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Member_Add_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No members yet." |
*
* @param {Member_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const member_empty: ((inputs?: Member_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Member_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "+{count} more" |
*
* @param {Member_MoreInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const member_more: ((inputs: Member_MoreInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Member_MoreInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search members…" |
*
* @param {Member_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const member_search: ((inputs?: Member_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Member_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Action" |
*
* @param {Nav_ActionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_action: ((inputs?: Nav_ActionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_ActionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} active alarm" |
* | * | "{count} active alarms" |
*
* @param {Nav_Active_AlarmsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_active_alarms: ((inputs: Nav_Active_AlarmsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_Active_AlarmsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Activity" |
*
* @param {Nav_ActivityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_activity: ((inputs?: Nav_ActivityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_ActivityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Alarms" |
*
* @param {Nav_AlarmsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_alarms: ((inputs?: Nav_AlarmsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_AlarmsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automations" |
*
* @param {Nav_AutomationsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_automations: ((inputs?: Nav_AutomationsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_AutomationsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Dashboard" |
*
* @param {Nav_DashboardInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_dashboard: ((inputs?: Nav_DashboardInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_DashboardInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Data viewer" |
*
* @param {Nav_Data_ViewerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_data_viewer: ((inputs?: Nav_Data_ViewerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_Data_ViewerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Devices" |
*
* @param {Nav_DevicesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_devices: ((inputs?: Nav_DevicesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_DevicesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effects" |
*
* @param {Nav_EffectsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_effects: ((inputs?: Nav_EffectsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_EffectsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Groups" |
*
* @param {Nav_GroupsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_groups: ((inputs?: Nav_GroupsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_GroupsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Integrations" |
*
* @param {Nav_IntegrationsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_integrations: ((inputs?: Nav_IntegrationsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_IntegrationsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Log out ({name})" |
*
* @param {Nav_Log_OutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_log_out: ((inputs: Nav_Log_OutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_Log_OutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Logs" |
*
* @param {Nav_LogsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_logs: ((inputs?: Nav_LogsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_LogsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Maintenance" |
*
* @param {Nav_MaintenanceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_maintenance: ((inputs?: Nav_MaintenanceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_MaintenanceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} maintenance task" |
* | * | "{count} maintenance tasks" |
*
* @param {Nav_Maintenance_TasksInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_maintenance_tasks: ((inputs: Nav_Maintenance_TasksInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_Maintenance_TasksInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Map" |
*
* @param {Nav_MapInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_map: ((inputs?: Nav_MapInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_MapInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Monitoring" |
*
* @param {Nav_MonitoringInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_monitoring: ((inputs?: Nav_MonitoringInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_MonitoringInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Profile" |
*
* @param {Nav_ProfileInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_profile: ((inputs?: Nav_ProfileInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_ProfileInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rooms" |
*
* @param {Nav_RoomsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_rooms: ((inputs?: Nav_RoomsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_RoomsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scenes" |
*
* @param {Nav_ScenesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_scenes: ((inputs?: Nav_ScenesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_ScenesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Settings" |
*
* @param {Nav_SettingsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_settings: ((inputs?: Nav_SettingsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_SettingsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Signed in as {name}" |
*
* @param {Nav_Signed_In_AsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_signed_in_as: ((inputs: Nav_Signed_In_AsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_Signed_In_AsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "System" |
*
* @param {Nav_SystemInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_system: ((inputs?: Nav_SystemInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_SystemInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Things" |
*
* @param {Nav_ThingsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_things: ((inputs?: Nav_ThingsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_ThingsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Users" |
*
* @param {Nav_UsersInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_users: ((inputs?: Nav_UsersInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_UsersInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhooks" |
*
* @param {Nav_WebhooksInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const nav_webhooks: ((inputs?: Nav_WebhooksInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Nav_WebhooksInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Current" |
*
* @param {Plug_CurrentInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const plug_current: ((inputs?: Plug_CurrentInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Plug_CurrentInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Energy" |
*
* @param {Plug_EnergyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const plug_energy: ((inputs?: Plug_EnergyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Plug_EnergyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Plug status" |
*
* @param {Plug_StatusInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const plug_status: ((inputs?: Plug_StatusInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Plug_StatusInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Toggle plug" |
*
* @param {Plug_ToggleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const plug_toggle: ((inputs?: Plug_ToggleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Plug_ToggleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Voltage" |
*
* @param {Plug_VoltageInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const plug_voltage: ((inputs?: Plug_VoltageInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Plug_VoltageInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Account" |
*
* @param {Profile_AccountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_account: ((inputs?: Profile_AccountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_AccountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Failed to remove avatar." |
*
* @param {Profile_Avatar_Clear_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_avatar_clear_failed: ((inputs?: Profile_Avatar_Clear_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Avatar_Clear_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "JPEG, PNG, or WebP. Max {size} MB." |
*
* @param {Profile_Avatar_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_avatar_help: ((inputs: Profile_Avatar_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Avatar_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Image too large (max {size} MB)." |
*
* @param {Profile_Avatar_Too_LargeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_avatar_too_large: ((inputs: Profile_Avatar_Too_LargeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Avatar_Too_LargeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Failed to upload avatar." |
*
* @param {Profile_Avatar_Upload_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_avatar_upload_failed: ((inputs?: Profile_Avatar_Upload_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Avatar_Upload_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Change avatar" |
*
* @param {Profile_Change_AvatarInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_change_avatar: ((inputs?: Profile_Change_AvatarInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Change_AvatarInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Change password" |
*
* @param {Profile_Change_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_change_password: ((inputs?: Profile_Change_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Change_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Current password" |
*
* @param {Profile_Current_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_current_password: ((inputs?: Profile_Current_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Current_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Display name" |
*
* @param {Profile_Display_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_display_name: ((inputs?: Profile_Display_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Display_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Display name cannot be empty." |
*
* @param {Profile_Display_Name_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_display_name_empty: ((inputs?: Profile_Display_Name_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Display_Name_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Haptics" |
*
* @param {Profile_HapticsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_haptics: ((inputs?: Profile_HapticsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_HapticsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About haptics" |
*
* @param {Profile_Haptics_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_haptics_about: ((inputs?: Profile_Haptics_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Haptics_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enable haptics" |
*
* @param {Profile_Haptics_EnableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_haptics_enable: ((inputs?: Profile_Haptics_EnableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Haptics_EnableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Brief feedback for direct interactions on supported touch devices." |
*
* @param {Profile_Haptics_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_haptics_help: ((inputs?: Profile_Haptics_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Haptics_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Failed to update haptics." |
*
* @param {Profile_Haptics_Update_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_haptics_update_failed: ((inputs?: Profile_Haptics_Update_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Haptics_Update_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Language" |
*
* @param {Profile_LanguageInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_language: ((inputs?: Profile_LanguageInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_LanguageInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About language" |
*
* @param {Profile_Language_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_language_about: ((inputs?: Profile_Language_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Language_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Changes the language used throughout Hive." |
*
* @param {Profile_Language_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_language_help: ((inputs?: Profile_Language_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Language_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not update language" |
*
* @param {Profile_Language_Update_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_language_update_failed: ((inputs?: Profile_Language_Update_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Language_Update_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Please log in again with your new password." |
*
* @param {Profile_Login_AgainInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_login_again: ((inputs?: Profile_Login_AgainInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Login_AgainInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Member since" |
*
* @param {Profile_Member_SinceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_member_since: ((inputs?: Profile_Member_SinceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Member_SinceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Failed to update display name." |
*
* @param {Profile_Name_Update_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_name_update_failed: ((inputs?: Profile_Name_Update_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Name_Update_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Failed to change password." |
*
* @param {Profile_Password_Change_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_password_change_failed: ((inputs?: Profile_Password_Change_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Password_Change_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enter your current password, then pick a new one." |
*
* @param {Profile_Password_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_password_description: ((inputs?: Profile_Password_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Password_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Preferences" |
*
* @param {Profile_PreferencesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_preferences: ((inputs?: Profile_PreferencesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_PreferencesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Removing…" |
*
* @param {Profile_RemovingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_removing: ((inputs?: Profile_RemovingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_RemovingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Invalidate every signed-in session for this account, including this one." |
*
* @param {Profile_Sign_Out_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_sign_out_description: ((inputs?: Profile_Sign_Out_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Sign_Out_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sign out everywhere" |
*
* @param {Profile_Sign_Out_EverywhereInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_sign_out_everywhere: ((inputs?: Profile_Sign_Out_EverywhereInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Sign_Out_EverywhereInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Failed to sign out everywhere." |
*
* @param {Profile_Sign_Out_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_sign_out_failed: ((inputs?: Profile_Sign_Out_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Sign_Out_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Signed out of every device. Please log in again." |
*
* @param {Profile_Sign_Out_SuccessInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_sign_out_success: ((inputs?: Profile_Sign_Out_SuccessInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Sign_Out_SuccessInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Signing out…" |
*
* @param {Profile_Signing_OutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_signing_out: ((inputs?: Profile_Signing_OutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Signing_OutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About temperature unit" |
*
* @param {Profile_Temperature_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_temperature_about: ((inputs?: Profile_Temperature_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Temperature_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Celsius (°C)" |
*
* @param {Profile_Temperature_CelsiusInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_temperature_celsius: ((inputs?: Profile_Temperature_CelsiusInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Temperature_CelsiusInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Fahrenheit (°F)" |
*
* @param {Profile_Temperature_FahrenheitInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_temperature_fahrenheit: ((inputs?: Profile_Temperature_FahrenheitInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Temperature_FahrenheitInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Applies wherever temperature is shown. Values are stored in Celsius." |
*
* @param {Profile_Temperature_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_temperature_help: ((inputs?: Profile_Temperature_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Temperature_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Temperature unit" |
*
* @param {Profile_Temperature_UnitInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_temperature_unit: ((inputs?: Profile_Temperature_UnitInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Temperature_UnitInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Failed to update temperature unit." |
*
* @param {Profile_Temperature_Update_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_temperature_update_failed: ((inputs?: Profile_Temperature_Update_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Temperature_Update_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Theme" |
*
* @param {Profile_ThemeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_theme: ((inputs?: Profile_ThemeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_ThemeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About theme" |
*
* @param {Profile_Theme_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_theme_about: ((inputs?: Profile_Theme_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Theme_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Dark" |
*
* @param {Profile_Theme_DarkInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_theme_dark: ((inputs?: Profile_Theme_DarkInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Theme_DarkInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Saved per user. Before sign-in, pages follow the most recent theme on this device." |
*
* @param {Profile_Theme_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_theme_help: ((inputs?: Profile_Theme_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Theme_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Light" |
*
* @param {Profile_Theme_LightInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_theme_light: ((inputs?: Profile_Theme_LightInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Theme_LightInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Failed to update theme." |
*
* @param {Profile_Theme_Update_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_theme_update_failed: ((inputs?: Profile_Theme_Update_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Theme_Update_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "12-hour" |
*
* @param {Profile_Time_12_HourInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_time_12_hour: ((inputs?: Profile_Time_12_HourInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Time_12_HourInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "24-hour" |
*
* @param {Profile_Time_24_HourInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_time_24_hour: ((inputs?: Profile_Time_24_HourInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Time_24_HourInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Time format" |
*
* @param {Profile_Time_FormatInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_time_format: ((inputs?: Profile_Time_FormatInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Time_FormatInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About time format" |
*
* @param {Profile_Time_Format_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_time_format_about: ((inputs?: Profile_Time_Format_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Time_Format_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Applies wherever time is shown. Dates use the selected locale." |
*
* @param {Profile_Time_Format_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_time_format_help: ((inputs?: Profile_Time_Format_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Time_Format_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Failed to update time format." |
*
* @param {Profile_Time_Update_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_time_update_failed: ((inputs?: Profile_Time_Update_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_Time_Update_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Username" |
*
* @param {Profile_UsernameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const profile_username: ((inputs?: Profile_UsernameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Profile_UsernameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add to room" |
*
* @param {Room_AddInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_add: ((inputs?: Room_AddInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_AddInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick one or more devices to add to this room." |
*
* @param {Room_Add_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_add_description: ((inputs?: Room_Add_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Add_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add device or group" |
*
* @param {Room_Add_Device_GroupInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_add_device_group: ((inputs?: Room_Add_Device_GroupInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Add_Device_GroupInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add devices" |
*
* @param {Room_Add_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_add_generic: ((inputs?: Room_Add_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Add_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add devices to {name}" |
*
* @param {Room_Add_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_add_named: ((inputs: Room_Add_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Add_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search for devices or groups to add to this room." |
*
* @param {Room_Add_Search_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_add_search_description: ((inputs?: Room_Add_Search_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Add_Search_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Adjust {name} color" |
*
* @param {Room_Adjust_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_adjust_color: ((inputs: Room_Adjust_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Adjust_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Appliances" |
*
* @param {Room_AppliancesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_appliances: ((inputs?: Room_AppliancesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_AppliancesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create room" |
*
* @param {Room_CreateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_create: ((inputs?: Room_CreateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_CreateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Give your new room a name. You can add devices afterward." |
*
* @param {Room_Create_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_create_description: ((inputs?: Room_Create_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Create_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not create the room." |
*
* @param {Room_Create_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_create_failed: ((inputs?: Room_Create_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Create_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create your first room" |
*
* @param {Room_Create_FirstInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_create_first: ((inputs?: Room_Create_FirstInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Create_FirstInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create more" |
*
* @param {Room_Create_MoreInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_create_more: ((inputs?: Room_Create_MoreInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Create_MoreInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Creating…" |
*
* @param {Room_CreatingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_creating: ((inputs?: Room_CreatingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_CreatingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete room" |
*
* @param {Room_DeleteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_delete: ((inputs?: Room_DeleteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_DeleteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This action cannot be undone." |
*
* @param {Room_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_delete_description: ((inputs?: Room_Delete_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Delete_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the room." |
*
* @param {Room_Delete_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_delete_failed: ((inputs?: Room_Delete_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Delete_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This permanently deletes the selected rooms and removes their device assignments. This cannot be undone." |
*
* @param {Room_Delete_Many_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_delete_many_description: ((inputs?: Room_Delete_Many_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Delete_Many_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the rooms." |
*
* @param {Room_Delete_Many_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_delete_many_failed: ((inputs?: Room_Delete_Many_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Delete_Many_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Delete {count} room?" |
* | * | "Delete {count} rooms?" |
*
* @param {Room_Delete_Many_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_delete_many_title: ((inputs: Room_Delete_Many_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Delete_Many_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete “{name}”?" |
*
* @param {Room_Delete_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_delete_named: ((inputs: Room_Delete_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Delete_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scenes and lights for this room." |
*
* @param {Room_Drawer_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_drawer_description: ((inputs?: Room_Drawer_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Drawer_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit room" |
*
* @param {Room_EditInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_edit: ((inputs?: Room_EditInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_EditInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Room" |
*
* @param {Room_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_generic: ((inputs?: Room_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Lights" |
*
* @param {Room_LightsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_lights: ((inputs?: Room_LightsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_LightsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No members yet. Add devices or groups to this room." |
*
* @param {Room_Members_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_members_empty: ((inputs?: Room_Members_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Members_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Room name" |
*
* @param {Room_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_name: ((inputs?: Room_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No lights in this room." |
*
* @param {Room_No_LightsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_no_lights: ((inputs?: Room_No_LightsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_No_LightsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No rooms match your filters." |
*
* @param {Room_No_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_no_match: ((inputs?: Room_No_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_No_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No rooms yet." |
*
* @param {Room_NoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_none: ((inputs?: Room_NoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_NoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create a room to organize your devices by location." |
*
* @param {Room_None_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_none_help: ((inputs?: Room_None_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_None_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not rename the room." |
*
* @param {Room_Rename_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_rename_failed: ((inputs?: Room_Rename_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Rename_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save the room." |
*
* @param {Room_Save_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_save_failed: ((inputs?: Room_Save_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_Save_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search rooms…" |
*
* @param {Room_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const room_search: ((inputs?: Room_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Room_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Apply" |
*
* @param {Scene_Action_ApplyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_action_apply: ((inputs?: Scene_Action_ApplyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Action_ApplyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Stop" |
*
* @param {Scene_Action_StopInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_action_stop: ((inputs?: Scene_Action_StopInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Action_StopInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add source" |
*
* @param {Scene_Add_SourceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_add_source: ((inputs?: Scene_Add_SourceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Add_SourceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Apply {name}" |
*
* @param {Scene_Apply_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_apply_named: ((inputs: Scene_Apply_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Apply_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Back to scenes" |
*
* @param {Scene_BackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_back: ((inputs?: Scene_BackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_BackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose scene icon" |
*
* @param {Scene_Choose_IconInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_choose_icon: ((inputs?: Scene_Choose_IconInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Choose_IconInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add selector" |
*
* @param {Scene_Create_Add_SelectorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_add_selector: ((inputs?: Scene_Create_Add_SelectorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Add_SelectorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Adjust the lighting" |
*
* @param {Scene_Create_Adjust_LightingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_adjust_lighting: ((inputs?: Scene_Create_Adjust_LightingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Adjust_LightingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Back" |
*
* @param {Scene_Create_BackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_back: ((inputs?: Scene_Create_BackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_BackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create" |
*
* @param {Scene_Create_BreadcrumbInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_breadcrumb: ((inputs?: Scene_Create_BreadcrumbInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_BreadcrumbInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Building…" |
*
* @param {Scene_Create_BuildingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_building: ((inputs?: Scene_Create_BuildingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_BuildingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose where it lives" |
*
* @param {Scene_Create_Choose_LocationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_choose_location: ((inputs?: Scene_Create_Choose_LocationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Choose_LocationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose the look" |
*
* @param {Scene_Create_Choose_LookInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_choose_look: ((inputs?: Scene_Create_Choose_LookInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Choose_LookInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Creating…" |
*
* @param {Scene_Create_CreatingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_creating: ((inputs?: Scene_Create_CreatingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_CreatingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose a Vibe before continuing." |
*
* @param {Scene_Create_Error_Choose_VibeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_error_choose_vibe: ((inputs?: Scene_Create_Error_Choose_VibeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Error_Choose_VibeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not create the scene." |
*
* @param {Scene_Create_Error_CreateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_error_create: ((inputs?: Scene_Create_Error_CreateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Error_CreateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Full color" |
*
* @param {Scene_Create_Full_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_full_color: ((inputs?: Scene_Create_Full_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Full_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Loading gallery" |
*
* @param {Scene_Create_Loading_GalleryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_loading_gallery: ((inputs?: Scene_Create_Loading_GalleryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Loading_GalleryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Evening glow" |
*
* @param {Scene_Create_Name_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_name_placeholder: ((inputs?: Scene_Create_Name_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Name_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Name the scene" |
*
* @param {Scene_Create_Name_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_name_title: ((inputs?: Scene_Create_Name_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Name_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No gallery scenes are available." |
*
* @param {Scene_Create_No_GalleryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_no_gallery: ((inputs?: Scene_Create_No_GalleryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_No_GalleryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Photo atmosphere" |
*
* @param {Scene_Create_Photo_AtmosphereInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_photo_atmosphere: ((inputs?: Scene_Create_Photo_AtmosphereInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Photo_AtmosphereInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "JPEG, PNG, WebP, or another browser-supported image" |
*
* @param {Scene_Create_Photo_FormatsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_photo_formats: ((inputs?: Scene_Create_Photo_FormatsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Photo_FormatsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Hive uses a small color sample; your photo stays in this browser." |
*
* @param {Scene_Create_Photo_PrivacyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_photo_privacy: ((inputs?: Scene_Create_Photo_PrivacyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Photo_PrivacyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add controllable devices." |
*
* @param {Scene_Create_Supporting_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_supporting_description: ((inputs?: Scene_Create_Supporting_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Supporting_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create a scene" |
*
* @param {Scene_Create_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_title: ((inputs?: Scene_Create_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Turn {name} on" |
*
* @param {Scene_Create_Turn_OnInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_turn_on: ((inputs: Scene_Create_Turn_OnInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Turn_OnInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Your Vibe will appear here." |
*
* @param {Scene_Create_Vibe_Preview_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_vibe_preview_empty: ((inputs?: Scene_Create_Vibe_Preview_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Vibe_Preview_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Whites only" |
*
* @param {Scene_Create_Whites_OnlyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_create_whites_only: ((inputs?: Scene_Create_Whites_OnlyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Create_Whites_OnlyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add" |
*
* @param {Scene_Editor_AddInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_add: ((inputs?: Scene_Editor_AddInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_AddInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add lighting targets" |
*
* @param {Scene_Editor_Add_Lighting_TargetsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_add_lighting_targets: ((inputs?: Scene_Editor_Add_Lighting_TargetsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Add_Lighting_TargetsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add selector" |
*
* @param {Scene_Editor_Add_SelectorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_add_selector: ((inputs?: Scene_Editor_Add_SelectorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Add_SelectorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add supporting devices" |
*
* @param {Scene_Editor_Add_SupportingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_add_supporting: ((inputs?: Scene_Editor_Add_SupportingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Add_SupportingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add controllable non-light devices." |
*
* @param {Scene_Editor_Add_Supporting_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_add_supporting_description: ((inputs?: Scene_Editor_Add_Supporting_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Add_Supporting_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Adjust {name}" |
*
* @param {Scene_Editor_Adjust_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_adjust_device: ((inputs: Scene_Editor_Adjust_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Adjust_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Brightness" |
*
* @param {Scene_Editor_BrightnessInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_brightness: ((inputs?: Scene_Editor_BrightnessInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_BrightnessInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Capture" |
*
* @param {Scene_Editor_CaptureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_capture: ((inputs?: Scene_Editor_CaptureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_CaptureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Capture all" |
*
* @param {Scene_Editor_Capture_AllInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_capture_all: ((inputs?: Scene_Editor_Capture_AllInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Capture_AllInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Change" |
*
* @param {Scene_Editor_ChangeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_change: ((inputs?: Scene_Editor_ChangeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_ChangeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Change source" |
*
* @param {Scene_Editor_Change_SourceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_change_source: ((inputs?: Scene_Editor_Change_SourceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Change_SourceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose effect for {name}" |
*
* @param {Scene_Editor_Choose_EffectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_choose_effect: ((inputs: Scene_Editor_Choose_EffectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Choose_EffectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose devices, groups, or rooms." |
*
* @param {Scene_Editor_Choose_TargetsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_choose_targets: ((inputs?: Scene_Editor_Choose_TargetsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Choose_TargetsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear" |
*
* @param {Scene_Editor_ClearInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_clear: ((inputs?: Scene_Editor_ClearInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_ClearInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear override for {name}" |
*
* @param {Scene_Editor_Clear_OverrideInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_clear_override: ((inputs: Scene_Editor_Clear_OverrideInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Clear_OverrideInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Color" |
*
* @param {Scene_Editor_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_color: ((inputs?: Scene_Editor_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Devices" |
*
* @param {Scene_Editor_DevicesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_devices: ((inputs?: Scene_Editor_DevicesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_DevicesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Done" |
*
* @param {Scene_Editor_DoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_done: ((inputs?: Scene_Editor_DoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_DoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Scene_Editor_EditInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_edit: ((inputs?: Scene_Editor_EditInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_EditInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit {name}" |
*
* @param {Scene_Editor_Edit_ItemInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_edit_item: ((inputs: Scene_Editor_Edit_ItemInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Edit_ItemInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit selector" |
*
* @param {Scene_Editor_Edit_SelectorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_edit_selector: ((inputs?: Scene_Editor_Edit_SelectorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Edit_SelectorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Effect" |
*
* @param {Scene_Editor_EffectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_effect: ((inputs?: Scene_Editor_EffectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_EffectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Empty." |
*
* @param {Scene_Editor_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_empty: ((inputs?: Scene_Editor_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Groups" |
*
* @param {Scene_Editor_GroupsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_groups: ((inputs?: Scene_Editor_GroupsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_GroupsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Lighting" |
*
* @param {Scene_Editor_LightingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_lighting: ((inputs?: Scene_Editor_LightingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_LightingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Live" |
*
* @param {Scene_Editor_LiveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_live: ((inputs?: Scene_Editor_LiveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_LiveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} live power" |
*
* @param {Scene_Editor_Live_PowerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_live_power: ((inputs: Scene_Editor_Live_PowerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Live_PowerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Movement" |
*
* @param {Scene_Editor_MovementInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_movement: ((inputs?: Scene_Editor_MovementInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_MovementInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Alive" |
*
* @param {Scene_Editor_Movement_AliveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_movement_alive: ((inputs?: Scene_Editor_Movement_AliveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Movement_AliveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Flowing" |
*
* @param {Scene_Editor_Movement_FlowingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_movement_flowing: ((inputs?: Scene_Editor_Movement_FlowingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Movement_FlowingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Gentle" |
*
* @param {Scene_Editor_Movement_GentleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_movement_gentle: ((inputs?: Scene_Editor_Movement_GentleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Movement_GentleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Still" |
*
* @param {Scene_Editor_Movement_StillInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_movement_still: ((inputs?: Scene_Editor_Movement_StillInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Movement_StillInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Nesting limit reached." |
*
* @param {Scene_Editor_Nesting_LimitInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_nesting_limit: ((inputs?: Scene_Editor_Nesting_LimitInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Nesting_LimitInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Off" |
*
* @param {Scene_Editor_OffInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_off: ((inputs?: Scene_Editor_OffInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_OffInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Hive will simplify the motion to keep transitions smooth. Choose a longer cycle or increase the continuous command rate for full motion detail." |
*
* @param {Scene_Editor_Output_SimplifiedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_output_simplified: ((inputs?: Scene_Editor_Output_SimplifiedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Output_SimplifiedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | sceneLightsPlural | zigbeeLightsPlural | output |
* | --- | --- | --- |
* | "one" | "one" | "{sceneLights} scene light · {zigbeeLights} Zigbee light sharing continuous output · about {interval} between updates per light." |
* | * | "one" | "{sceneLights} scene lights · {zigbeeLights} Zigbee light sharing continuous output · about {interval} between updates per light." |
* | "one" | * | "{sceneLights} scene light · {zigbeeLights} Zigbee lights sharing continuous output · about {interval} between updates per light." |
* | * | * | "{sceneLights} scene lights · {zigbeeLights} Zigbee lights sharing continuous output · about {interval} between updates per light." |
*
* @param {Scene_Editor_Output_SummaryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_output_summary: ((inputs: Scene_Editor_Output_SummaryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Output_SummaryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This cycle is too fast for the available continuous output. Hive will hold the motion still to avoid abrupt color jumps. Choose a longer cycle or increase th..." |
*
* @param {Scene_Editor_Output_Too_FastInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_output_too_fast: ((inputs?: Scene_Editor_Output_Too_FastInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Output_Too_FastInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pace" |
*
* @param {Scene_Editor_PaceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_pace: ((inputs?: Scene_Editor_PaceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_PaceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Power" |
*
* @param {Scene_Editor_PowerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_power: ((inputs?: Scene_Editor_PowerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_PowerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Scene_Editor_RemoveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_remove: ((inputs?: Scene_Editor_RemoveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_RemoveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove {name}" |
*
* @param {Scene_Editor_Remove_ItemInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_remove_item: ((inputs: Scene_Editor_Remove_ItemInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Remove_ItemInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove source" |
*
* @param {Scene_Editor_Remove_SourceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_remove_source: ((inputs?: Scene_Editor_Remove_SourceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Remove_SourceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rooms" |
*
* @param {Scene_Editor_RoomsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_rooms: ((inputs?: Scene_Editor_RoomsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_RoomsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Selector" |
*
* @param {Scene_Editor_SelectorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_selector: ((inputs?: Scene_Editor_SelectorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_SelectorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Selector name" |
*
* @param {Scene_Editor_Selector_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_selector_name: ((inputs?: Scene_Editor_Selector_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Selector_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set {name} power" |
*
* @param {Scene_Editor_Set_PowerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_set_power: ((inputs: Scene_Editor_Set_PowerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Set_PowerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Shuffle" |
*
* @param {Scene_Editor_ShuffleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_shuffle: ((inputs?: Scene_Editor_ShuffleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_ShuffleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Simple" |
*
* @param {Scene_Editor_SimpleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_simple: ((inputs?: Scene_Editor_SimpleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_SimpleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "State" |
*
* @param {Scene_Editor_StateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_state: ((inputs?: Scene_Editor_StateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_StateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Supporting devices" |
*
* @param {Scene_Editor_Supporting_DevicesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_supporting_devices: ((inputs?: Scene_Editor_Supporting_DevicesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_Supporting_DevicesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Targets" |
*
* @param {Scene_Editor_TargetsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_editor_targets: ((inputs?: Scene_Editor_TargetsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Editor_TargetsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save the scene." |
*
* @param {Scene_Error_SaveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_error_save: ((inputs?: Scene_Error_SaveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Error_SaveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scene" |
*
* @param {Scene_FallbackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_fallback: ((inputs?: Scene_FallbackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_FallbackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scene" |
*
* @param {Scene_GenericInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_generic: ((inputs?: Scene_GenericInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_GenericInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Loading scene…" |
*
* @param {Scene_LoadingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_loading: ((inputs?: Scene_LoadingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_LoadingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scene name" |
*
* @param {Scene_Name_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_name_aria: ((inputs?: Scene_Name_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Name_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This scene could not be found." |
*
* @param {Scene_Not_FoundInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_not_found: ((inputs?: Scene_Not_FoundInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Not_FoundInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Stop {name}" |
*
* @param {Scene_Stop_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scene_stop_named: ((inputs: Scene_Stop_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scene_Stop_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add target" |
*
* @param {Scenes_Add_TargetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_add_target: ((inputs?: Scenes_Add_TargetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Add_TargetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add targets" |
*
* @param {Scenes_Add_TargetsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_add_targets: ((inputs?: Scenes_Add_TargetsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Add_TargetsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick devices, groups, or rooms to include in this scene." |
*
* @param {Scenes_Add_Targets_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_add_targets_description: ((inputs?: Scenes_Add_Targets_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Add_Targets_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add targets to {name}" |
*
* @param {Scenes_Add_Targets_ToInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_add_targets_to: ((inputs: Scenes_Add_Targets_ToInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Add_Targets_ToInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Apply scene" |
*
* @param {Scenes_ApplyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_apply: ((inputs?: Scenes_ApplyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_ApplyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Breakdown" |
*
* @param {Scenes_Column_BreakdownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_column_breakdown: ((inputs?: Scenes_Column_BreakdownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Column_BreakdownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Created by" |
*
* @param {Scenes_Column_Created_ByInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_column_created_by: ((inputs?: Scenes_Column_Created_ByInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Column_Created_ByInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Scenes_Column_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_column_name: ((inputs?: Scenes_Column_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Column_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rooms" |
*
* @param {Scenes_Column_RoomsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_column_rooms: ((inputs?: Scenes_Column_RoomsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Column_RoomsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Targets" |
*
* @param {Scenes_Column_TargetsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_column_targets: ((inputs?: Scenes_Column_TargetsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Column_TargetsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create scene" |
*
* @param {Scenes_CreateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_create: ((inputs?: Scenes_CreateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_CreateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create your first scene" |
*
* @param {Scenes_Create_FirstInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_create_first: ((inputs?: Scenes_Create_FirstInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Create_FirstInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create" |
*
* @param {Scenes_Create_ShortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_create_short: ((inputs?: Scenes_Create_ShortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Create_ShortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Are you sure you want to delete “{name}”? This action cannot be undone." |
*
* @param {Scenes_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_delete_description: ((inputs: Scenes_Delete_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Delete_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This permanently deletes the selected scenes and their compositions. This cannot be undone." |
*
* @param {Scenes_Delete_Many_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_delete_many_description: ((inputs?: Scenes_Delete_Many_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Delete_Many_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Delete {count} scene?" |
* | * | "Delete {count} scenes?" |
*
* @param {Scenes_Delete_Many_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_delete_many_title: ((inputs: Scenes_Delete_Many_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Delete_Many_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete scene" |
*
* @param {Scenes_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_delete_title: ((inputs?: Scenes_Delete_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Delete_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} device" |
* | * | "{count} devices" |
*
* @param {Scenes_Device_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_device_count: ((inputs: Scenes_Device_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Device_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Devices" |
*
* @param {Scenes_DevicesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_devices: ((inputs?: Scenes_DevicesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_DevicesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit scene" |
*
* @param {Scenes_EditInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_edit: ((inputs?: Scenes_EditInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_EditInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No scenes yet." |
*
* @param {Scenes_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_empty: ((inputs?: Scenes_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create a scene to save device state presets and apply them with a single action." |
*
* @param {Scenes_Empty_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_empty_help: ((inputs?: Scenes_Empty_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Empty_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not apply the scene." |
*
* @param {Scenes_Error_ApplyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_error_apply: ((inputs?: Scenes_Error_ApplyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Error_ApplyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the scene." |
*
* @param {Scenes_Error_DeleteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_error_delete: ((inputs?: Scenes_Error_DeleteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Error_DeleteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the scenes." |
*
* @param {Scenes_Error_Delete_ManyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_error_delete_many: ((inputs?: Scenes_Error_Delete_ManyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Error_Delete_ManyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not change the icon." |
*
* @param {Scenes_Error_IconInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_error_icon: ((inputs?: Scenes_Error_IconInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Error_IconInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not rename the scene." |
*
* @param {Scenes_Error_RenameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_error_rename: ((inputs?: Scenes_Error_RenameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Error_RenameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not stop the scene." |
*
* @param {Scenes_Error_StopInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_error_stop: ((inputs?: Scenes_Error_StopInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Error_StopInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not update the scene." |
*
* @param {Scenes_Error_UpdateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_error_update: ((inputs?: Scenes_Error_UpdateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Error_UpdateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device" |
*
* @param {Scenes_Filter_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_filter_device: ((inputs?: Scenes_Filter_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Filter_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Empty" |
*
* @param {Scenes_Filter_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_filter_empty: ((inputs?: Scenes_Filter_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Filter_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Group" |
*
* @param {Scenes_Filter_GroupInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_filter_group: ((inputs?: Scenes_Filter_GroupInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Filter_GroupInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Room" |
*
* @param {Scenes_Filter_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_filter_room: ((inputs?: Scenes_Filter_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Filter_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Target" |
*
* @param {Scenes_Filter_TargetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_filter_target: ((inputs?: Scenes_Filter_TargetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Filter_TargetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Groups" |
*
* @param {Scenes_GroupsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_groups: ((inputs?: Scenes_GroupsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_GroupsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Loading scenes…" |
*
* @param {Scenes_LoadingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_loading: ((inputs?: Scenes_LoadingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_LoadingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} member" |
* | * | "{count} members" |
*
* @param {Scenes_Member_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_member_count: ((inputs: Scenes_Member_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Member_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No scenes match your filters." |
*
* @param {Scenes_No_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_no_match: ((inputs?: Scenes_No_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_No_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No targets" |
*
* @param {Scenes_No_TargetsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_no_targets: ((inputs?: Scenes_No_TargetsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_No_TargetsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rooms" |
*
* @param {Scenes_RoomsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_rooms: ((inputs?: Scenes_RoomsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_RoomsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search scenes…" |
*
* @param {Scenes_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_search: ((inputs?: Scenes_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select {name}" |
*
* @param {Scenes_SelectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_select: ((inputs: Scenes_SelectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_SelectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Stop scene" |
*
* @param {Scenes_StopInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_stop: ((inputs?: Scenes_StopInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_StopInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} target" |
* | * | "{count} targets" |
*
* @param {Scenes_Target_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_target_count: ((inputs: Scenes_Target_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_Target_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scenes" |
*
* @param {Scenes_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const scenes_title: ((inputs?: Scenes_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Scenes_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Contact" |
*
* @param {Sensor_ContactInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_contact: ((inputs?: Sensor_ContactInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_ContactInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Current readings" |
*
* @param {Sensor_Current_ReadingsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_current_readings: ((inputs?: Sensor_Current_ReadingsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_Current_ReadingsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sensor details" |
*
* @param {Sensor_DetailsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_details: ((inputs?: Sensor_DetailsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_DetailsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device posture" |
*
* @param {Sensor_Device_PostureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_device_posture: ((inputs?: Sensor_Device_PostureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_Device_PostureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Door" |
*
* @param {Sensor_DoorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_door: ((inputs?: Sensor_DoorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_DoorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Humidity" |
*
* @param {Sensor_HumidityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_humidity: ((inputs?: Sensor_HumidityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_HumidityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Illuminance" |
*
* @param {Sensor_IlluminanceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_illuminance: ((inputs?: Sensor_IlluminanceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_IlluminanceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No sensor readings available." |
*
* @param {Sensor_No_ReadingsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_no_readings: ((inputs?: Sensor_No_ReadingsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_No_ReadingsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Orientation" |
*
* @param {Sensor_OrientationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_orientation: ((inputs?: Sensor_OrientationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_OrientationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pressure" |
*
* @param {Sensor_PressureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_pressure: ((inputs?: Sensor_PressureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_PressureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Temperature" |
*
* @param {Sensor_TemperatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_temperature: ((inputs?: Sensor_TemperatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_TemperatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Window" |
*
* @param {Sensor_WindowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const sensor_window: ((inputs?: Sensor_WindowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Sensor_WindowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "History" |
*
* @param {Settings_HistoryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const settings_history: ((inputs?: Settings_HistoryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Settings_HistoryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Internals" |
*
* @param {Settings_InternalsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const settings_internals: ((inputs?: Settings_InternalsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Settings_InternalsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Debug" |
*
* @param {Settings_Log_DebugInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const settings_log_debug: ((inputs?: Settings_Log_DebugInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Settings_Log_DebugInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Error" |
*
* @param {Settings_Log_ErrorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const settings_log_error: ((inputs?: Settings_Log_ErrorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Settings_Log_ErrorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Info" |
*
* @param {Settings_Log_InfoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const settings_log_info: ((inputs?: Settings_Log_InfoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Settings_Log_InfoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Log level" |
*
* @param {Settings_Log_LevelInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const settings_log_level: ((inputs?: Settings_Log_LevelInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Settings_Log_LevelInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Warn" |
*
* @param {Settings_Log_WarnInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const settings_log_warn: ((inputs?: Settings_Log_WarnInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Settings_Log_WarnInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Retention days" |
*
* @param {Settings_Retention_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const settings_retention_aria: ((inputs?: Settings_Retention_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Settings_Retention_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Retention (days)" |
*
* @param {Settings_Retention_DaysInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const settings_retention_days: ((inputs?: Settings_Retention_DaysInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Settings_Retention_DaysInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device state samples older than this are pruned every 6 hours." |
*
* @param {Settings_Retention_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const settings_retention_help: ((inputs?: Settings_Retention_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Settings_Retention_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save settings." |
*
* @param {Settings_Save_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const settings_save_failed: ((inputs?: Settings_Save_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Settings_Save_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Actions" |
*
* @param {Shared_ActionsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_actions: ((inputs?: Shared_ActionsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_ActionsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Add {count} item" |
* | * | "Add {count} items" |
*
* @param {Shared_Add_ItemsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_add_items: ((inputs: Shared_Add_ItemsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Add_ItemsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Batch actions" |
*
* @param {Shared_Batch_ActionsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_batch_actions: ((inputs?: Shared_Batch_ActionsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Batch_ActionsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose icon" |
*
* @param {Shared_Choose_IconInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_choose_icon: ((inputs?: Shared_Choose_IconInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Choose_IconInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear selection" |
*
* @param {Shared_Clear_SelectionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_clear_selection: ((inputs?: Shared_Clear_SelectionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Clear_SelectionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Columns" |
*
* @param {Shared_ColumnsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_columns: ((inputs?: Shared_ColumnsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_ColumnsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Restore defaults" |
*
* @param {Shared_Columns_RestoreInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_columns_restore: ((inputs?: Shared_Columns_RestoreInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Columns_RestoreInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit columns" |
*
* @param {Shared_Columns_ShowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_columns_show: ((inputs?: Shared_Columns_ShowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Columns_ShowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "End" |
*
* @param {Shared_Date_EndInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_date_end: ((inputs?: Shared_Date_EndInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Date_EndInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "From" |
*
* @param {Shared_Date_FromInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_date_from: ((inputs?: Shared_Date_FromInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Date_FromInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last {count} days" |
*
* @param {Shared_Date_Last_DaysInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_date_last_days: ((inputs: Shared_Date_Last_DaysInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Date_Last_DaysInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last hour" |
*
* @param {Shared_Date_Last_HourInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_date_last_hour: ((inputs?: Shared_Date_Last_HourInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Date_Last_HourInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last {count} hours" |
*
* @param {Shared_Date_Last_HoursInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_date_last_hours: ((inputs: Shared_Date_Last_HoursInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Date_Last_HoursInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last year" |
*
* @param {Shared_Date_Last_YearInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_date_last_year: ((inputs?: Shared_Date_Last_YearInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Date_Last_YearInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick a range" |
*
* @param {Shared_Date_Pick_RangeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_date_pick_range: ((inputs?: Shared_Date_Pick_RangeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Date_Pick_RangeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Date range" |
*
* @param {Shared_Date_RangeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_date_range: ((inputs?: Shared_Date_RangeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Date_RangeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Start" |
*
* @param {Shared_Date_StartInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_date_start: ((inputs?: Shared_Date_StartInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Date_StartInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "To" |
*
* @param {Shared_Date_ToInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_date_to: ((inputs?: Shared_Date_ToInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Date_ToInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} device" |
* | * | "{count} devices" |
*
* @param {Shared_Device_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_device_count: ((inputs: Shared_Device_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Device_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Filters" |
*
* @param {Shared_FiltersInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_filters: ((inputs?: Shared_FiltersInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_FiltersInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} group" |
* | * | "{count} groups" |
*
* @param {Shared_Group_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_group_count: ((inputs: Shared_Group_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Group_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} member" |
* | * | "{count} members" |
*
* @param {Shared_Member_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_member_count: ((inputs: Shared_Member_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Member_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Multi-room" |
*
* @param {Shared_Multi_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_multi_room: ((inputs?: Shared_Multi_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Multi_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Next month" |
*
* @param {Shared_Next_MonthInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_next_month: ((inputs?: Shared_Next_MonthInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Next_MonthInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No matches." |
*
* @param {Shared_No_MatchesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_no_matches: ((inputs?: Shared_No_MatchesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_No_MatchesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No results." |
*
* @param {Shared_No_ResultsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_no_results: ((inputs?: Shared_No_ResultsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_No_ResultsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No results found." |
*
* @param {Shared_No_Results_FoundInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_no_results_found: ((inputs?: Shared_No_Results_FoundInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_No_Results_FoundInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No targets" |
*
* @param {Shared_No_TargetsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_no_targets: ((inputs?: Shared_No_TargetsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_No_TargetsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Decrease value" |
*
* @param {Shared_Number_DecreaseInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_number_decrease: ((inputs?: Shared_Number_DecreaseInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Number_DecreaseInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Increase value" |
*
* @param {Shared_Number_IncreaseInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_number_increase: ((inputs?: Shared_Number_IncreaseInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Number_IncreaseInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pick an item." |
*
* @param {Shared_Pick_ItemInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_pick_item: ((inputs?: Shared_Pick_ItemInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Pick_ItemInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Previous month" |
*
* @param {Shared_Previous_MonthInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_previous_month: ((inputs?: Shared_Previous_MonthInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Previous_MonthInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} room" |
* | * | "{count} rooms" |
*
* @param {Shared_Room_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_room_count: ((inputs: Shared_Room_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Room_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select all" |
*
* @param {Shared_Select_AllInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_select_all: ((inputs?: Shared_Select_AllInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Select_AllInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select all rows" |
*
* @param {Shared_Select_All_RowsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_select_all_rows: ((inputs?: Shared_Select_All_RowsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Select_All_RowsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select {name}" |
*
* @param {Shared_Select_ItemInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_select_item: ((inputs: Shared_Select_ItemInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Select_ItemInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select row" |
*
* @param {Shared_Select_RowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_select_row: ((inputs?: Shared_Select_RowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Select_RowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} selected" |
* | * | "{count} selected" |
*
* @param {Shared_Selected_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_selected_count: ((inputs: Shared_Selected_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Selected_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} selector" |
* | * | "{count} selectors" |
*
* @param {Shared_Selector_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_selector_count: ((inputs: Shared_Selector_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Selector_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Show {name} members" |
*
* @param {Shared_Show_MembersInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_show_members: ((inputs: Shared_Show_MembersInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Show_MembersInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sidebar" |
*
* @param {Shared_SidebarInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_sidebar: ((inputs?: Shared_SidebarInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_SidebarInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Displays the mobile navigation." |
*
* @param {Shared_Sidebar_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_sidebar_description: ((inputs?: Shared_Sidebar_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Sidebar_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Toggle sidebar" |
*
* @param {Shared_Sidebar_ToggleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_sidebar_toggle: ((inputs?: Shared_Sidebar_ToggleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Sidebar_ToggleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "You have unsaved changes that will be lost if you leave this page." |
*
* @param {Shared_Unsaved_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_unsaved_description: ((inputs?: Shared_Unsaved_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Unsaved_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Discard and leave" |
*
* @param {Shared_Unsaved_LeaveInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_unsaved_leave: ((inputs?: Shared_Unsaved_LeaveInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Unsaved_LeaveInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Stay" |
*
* @param {Shared_Unsaved_StayInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_unsaved_stay: ((inputs?: Shared_Unsaved_StayInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Unsaved_StayInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unsaved changes" |
*
* @param {Shared_Unsaved_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_unsaved_title: ((inputs?: Shared_Unsaved_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_Unsaved_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cards" |
*
* @param {Shared_View_CardsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_view_cards: ((inputs?: Shared_View_CardsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_View_CardsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Card view" |
*
* @param {Shared_View_Cards_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_view_cards_aria: ((inputs?: Shared_View_Cards_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_View_Cards_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Table" |
*
* @param {Shared_View_TableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_view_table: ((inputs?: Shared_View_TableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_View_TableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Table view" |
*
* @param {Shared_View_Table_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const shared_view_table_aria: ((inputs?: Shared_View_Table_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Shared_View_Table_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Apartment" |
*
* @param {Standard_Room_ApartmentInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_apartment: ((inputs?: Standard_Room_ApartmentInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_ApartmentInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Attic" |
*
* @param {Standard_Room_AtticInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_attic: ((inputs?: Standard_Room_AtticInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_AtticInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Backyard" |
*
* @param {Standard_Room_BackyardInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_backyard: ((inputs?: Standard_Room_BackyardInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_BackyardInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Balcony" |
*
* @param {Standard_Room_BalconyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_balcony: ((inputs?: Standard_Room_BalconyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_BalconyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Basement" |
*
* @param {Standard_Room_BasementInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_basement: ((inputs?: Standard_Room_BasementInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_BasementInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Bathroom" |
*
* @param {Standard_Room_BathroomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_bathroom: ((inputs?: Standard_Room_BathroomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_BathroomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Bedroom" |
*
* @param {Standard_Room_BedroomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_bedroom: ((inputs?: Standard_Room_BedroomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_BedroomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Boiler room" |
*
* @param {Standard_Room_Boiler_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_boiler_room: ((inputs?: Standard_Room_Boiler_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Boiler_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cellar" |
*
* @param {Standard_Room_CellarInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_cellar: ((inputs?: Standard_Room_CellarInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_CellarInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Children's room" |
*
* @param {Standard_Room_Childrens_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_childrens_room: ((inputs?: Standard_Room_Childrens_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Childrens_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Closet" |
*
* @param {Standard_Room_ClosetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_closet: ((inputs?: Standard_Room_ClosetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_ClosetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Conservatory" |
*
* @param {Standard_Room_ConservatoryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_conservatory: ((inputs?: Standard_Room_ConservatoryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_ConservatoryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Courtyard" |
*
* @param {Standard_Room_CourtyardInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_courtyard: ((inputs?: Standard_Room_CourtyardInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_CourtyardInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Deck" |
*
* @param {Standard_Room_DeckInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_deck: ((inputs?: Standard_Room_DeckInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_DeckInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Dining room" |
*
* @param {Standard_Room_Dining_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_dining_room: ((inputs?: Standard_Room_Dining_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Dining_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Dressing room" |
*
* @param {Standard_Room_Dressing_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_dressing_room: ((inputs?: Standard_Room_Dressing_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Dressing_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Driveway" |
*
* @param {Standard_Room_DrivewayInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_driveway: ((inputs?: Standard_Room_DrivewayInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_DrivewayInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Entryway" |
*
* @param {Standard_Room_EntrywayInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_entryway: ((inputs?: Standard_Room_EntrywayInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_EntrywayInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Front yard" |
*
* @param {Standard_Room_Front_YardInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_front_yard: ((inputs?: Standard_Room_Front_YardInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Front_YardInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Game room" |
*
* @param {Standard_Room_Game_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_game_room: ((inputs?: Standard_Room_Game_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Game_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Garage" |
*
* @param {Standard_Room_GarageInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_garage: ((inputs?: Standard_Room_GarageInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_GarageInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Garden" |
*
* @param {Standard_Room_GardenInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_garden: ((inputs?: Standard_Room_GardenInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_GardenInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Greenhouse" |
*
* @param {Standard_Room_GreenhouseInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_greenhouse: ((inputs?: Standard_Room_GreenhouseInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_GreenhouseInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guest bathroom" |
*
* @param {Standard_Room_Guest_BathroomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_guest_bathroom: ((inputs?: Standard_Room_Guest_BathroomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Guest_BathroomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guest bedroom" |
*
* @param {Standard_Room_Guest_BedroomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_guest_bedroom: ((inputs?: Standard_Room_Guest_BedroomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Guest_BedroomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guest room" |
*
* @param {Standard_Room_Guest_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_guest_room: ((inputs?: Standard_Room_Guest_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Guest_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Gym" |
*
* @param {Standard_Room_GymInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_gym: ((inputs?: Standard_Room_GymInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_GymInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Hallway" |
*
* @param {Standard_Room_HallwayInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_hallway: ((inputs?: Standard_Room_HallwayInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_HallwayInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Home office" |
*
* @param {Standard_Room_Home_OfficeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_home_office: ((inputs?: Standard_Room_Home_OfficeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Home_OfficeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Home theater" |
*
* @param {Standard_Room_Home_TheaterInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_home_theater: ((inputs?: Standard_Room_Home_TheaterInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Home_TheaterInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Kitchen" |
*
* @param {Standard_Room_KitchenInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_kitchen: ((inputs?: Standard_Room_KitchenInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_KitchenInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Kitchenette" |
*
* @param {Standard_Room_KitchenetteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_kitchenette: ((inputs?: Standard_Room_KitchenetteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_KitchenetteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Landing" |
*
* @param {Standard_Room_LandingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_landing: ((inputs?: Standard_Room_LandingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_LandingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Laundry room" |
*
* @param {Standard_Room_Laundry_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_laundry_room: ((inputs?: Standard_Room_Laundry_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Laundry_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Library" |
*
* @param {Standard_Room_LibraryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_library: ((inputs?: Standard_Room_LibraryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_LibraryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Living room" |
*
* @param {Standard_Room_Living_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_living_room: ((inputs?: Standard_Room_Living_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Living_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Lobby" |
*
* @param {Standard_Room_LobbyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_lobby: ((inputs?: Standard_Room_LobbyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_LobbyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Primary bathroom" |
*
* @param {Standard_Room_Master_BathroomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_master_bathroom: ((inputs?: Standard_Room_Master_BathroomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Master_BathroomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Primary bedroom" |
*
* @param {Standard_Room_Master_BedroomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_master_bedroom: ((inputs?: Standard_Room_Master_BedroomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Master_BedroomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Media room" |
*
* @param {Standard_Room_Media_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_media_room: ((inputs?: Standard_Room_Media_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Media_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Mudroom" |
*
* @param {Standard_Room_MudroomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_mudroom: ((inputs?: Standard_Room_MudroomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_MudroomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Music room" |
*
* @param {Standard_Room_Music_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_music_room: ((inputs?: Standard_Room_Music_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Music_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Nursery" |
*
* @param {Standard_Room_NurseryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_nursery: ((inputs?: Standard_Room_NurseryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_NurseryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Office" |
*
* @param {Standard_Room_OfficeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_office: ((inputs?: Standard_Room_OfficeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_OfficeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pantry" |
*
* @param {Standard_Room_PantryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_pantry: ((inputs?: Standard_Room_PantryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_PantryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Parking" |
*
* @param {Standard_Room_ParkingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_parking: ((inputs?: Standard_Room_ParkingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_ParkingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Patio" |
*
* @param {Standard_Room_PatioInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_patio: ((inputs?: Standard_Room_PatioInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_PatioInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Playroom" |
*
* @param {Standard_Room_PlayroomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_playroom: ((inputs?: Standard_Room_PlayroomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_PlayroomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pool" |
*
* @param {Standard_Room_PoolInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_pool: ((inputs?: Standard_Room_PoolInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_PoolInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Porch" |
*
* @param {Standard_Room_PorchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_porch: ((inputs?: Standard_Room_PorchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_PorchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Powder room" |
*
* @param {Standard_Room_Powder_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_powder_room: ((inputs?: Standard_Room_Powder_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Powder_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Reception" |
*
* @param {Standard_Room_ReceptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_reception: ((inputs?: Standard_Room_ReceptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_ReceptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Roof" |
*
* @param {Standard_Room_RoofInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_roof: ((inputs?: Standard_Room_RoofInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_RoofInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sauna" |
*
* @param {Standard_Room_SaunaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_sauna: ((inputs?: Standard_Room_SaunaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_SaunaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Server room" |
*
* @param {Standard_Room_Server_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_server_room: ((inputs?: Standard_Room_Server_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Server_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Shed" |
*
* @param {Standard_Room_ShedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_shed: ((inputs?: Standard_Room_ShedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_ShedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Shower room" |
*
* @param {Standard_Room_Shower_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_shower_room: ((inputs?: Standard_Room_Shower_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Shower_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Spa" |
*
* @param {Standard_Room_SpaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_spa: ((inputs?: Standard_Room_SpaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_SpaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Staircase" |
*
* @param {Standard_Room_StaircaseInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_staircase: ((inputs?: Standard_Room_StaircaseInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_StaircaseInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Storage room" |
*
* @param {Standard_Room_Storage_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_storage_room: ((inputs?: Standard_Room_Storage_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Storage_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Studio" |
*
* @param {Standard_Room_StudioInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_studio: ((inputs?: Standard_Room_StudioInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_StudioInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Study" |
*
* @param {Standard_Room_StudyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_study: ((inputs?: Standard_Room_StudyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_StudyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sunroom" |
*
* @param {Standard_Room_SunroomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_sunroom: ((inputs?: Standard_Room_SunroomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_SunroomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Terrace" |
*
* @param {Standard_Room_TerraceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_terrace: ((inputs?: Standard_Room_TerraceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_TerraceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Toilet" |
*
* @param {Standard_Room_ToiletInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_toilet: ((inputs?: Standard_Room_ToiletInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_ToiletInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Utility room" |
*
* @param {Standard_Room_Utility_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_utility_room: ((inputs?: Standard_Room_Utility_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Utility_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Waiting room" |
*
* @param {Standard_Room_Waiting_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_waiting_room: ((inputs?: Standard_Room_Waiting_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Waiting_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Walk-in closet" |
*
* @param {Standard_Room_Walk_In_ClosetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_walk_in_closet: ((inputs?: Standard_Room_Walk_In_ClosetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_Walk_In_ClosetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Wardrobe" |
*
* @param {Standard_Room_WardrobeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_wardrobe: ((inputs?: Standard_Room_WardrobeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_WardrobeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Workshop" |
*
* @param {Standard_Room_WorkshopInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const standard_room_workshop: ((inputs?: Standard_Room_WorkshopInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Standard_Room_WorkshopInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Available" |
*
* @param {State_AvailableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_available: ((inputs?: State_AvailableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_AvailableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Battery {percent}" |
*
* @param {State_BatteryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_battery: ((inputs: State_BatteryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_BatteryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Clear" |
*
* @param {State_ClearInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_clear: ((inputs?: State_ClearInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_ClearInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Target {temperature}" |
*
* @param {State_Climate_TargetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_climate_target: ((inputs: State_Climate_TargetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_Climate_TargetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Closed" |
*
* @param {State_ClosedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_closed: ((inputs?: State_ClosedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_ClosedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "On - {percent}" |
*
* @param {State_Light_On_BrightnessInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_light_on_brightness: ((inputs: State_Light_On_BrightnessInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_Light_On_BrightnessInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Motion detected" |
*
* @param {State_Motion_DetectedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_motion_detected: ((inputs?: State_Motion_DetectedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_Motion_DetectedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No data" |
*
* @param {State_No_DataInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_no_data: ((inputs?: State_No_DataInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_No_DataInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No motion" |
*
* @param {State_No_MotionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_no_motion: ((inputs?: State_No_MotionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_No_MotionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Occupied" |
*
* @param {State_OccupiedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_occupied: ((inputs?: State_OccupiedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_OccupiedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Off" |
*
* @param {State_OffInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_off: ((inputs?: State_OffInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_OffInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "On" |
*
* @param {State_OnInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_on: ((inputs?: State_OnInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_OnInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Open" |
*
* @param {State_OpenInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_open: ((inputs?: State_OpenInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_OpenInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{state} - {power}" |
*
* @param {State_Plug_PowerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_plug_power: ((inputs: State_Plug_PowerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_Plug_PowerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unavailable" |
*
* @param {State_UnavailableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_unavailable: ((inputs?: State_UnavailableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_UnavailableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unknown" |
*
* @param {State_UnknownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const state_unknown: ((inputs?: State_UnknownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<State_UnknownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Home automation dashboard" |
*
* @param {Static_App_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const static_app_description: ((inputs?: Static_App_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Static_App_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Dimming" |
*
* @param {Target_Cap_DimmingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_cap_dimming: ((inputs?: Target_Cap_DimmingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Cap_DimmingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Full colour" |
*
* @param {Target_Cap_Full_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_cap_full_color: ((inputs?: Target_Cap_Full_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Cap_Full_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Switchable" |
*
* @param {Target_Cap_SwitchableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_cap_switchable: ((inputs?: Target_Cap_SwitchableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Cap_SwitchableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Tunable white" |
*
* @param {Target_Cap_Tunable_WhiteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_cap_tunable_white: ((inputs?: Target_Cap_Tunable_WhiteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Cap_Tunable_WhiteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "and" |
*
* @param {Target_Connector_AndInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_connector_and: ((inputs?: Target_Connector_AndInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Connector_AndInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "or" |
*
* @param {Target_Connector_OrInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_connector_or: ((inputs?: Target_Connector_OrInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Connector_OrInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} device" |
* | * | "{count} devices" |
*
* @param {Target_Device_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_device_count: ((inputs: Target_Device_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Device_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Done — add this rule (Enter)" |
*
* @param {Target_Done_RuleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_done_rule: ((inputs?: Target_Done_RuleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Done_RuleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No matches" |
*
* @param {Target_No_MatchesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_no_matches: ((inputs?: Target_No_MatchesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_No_MatchesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "does not include" |
*
* @param {Target_Op_ExcludesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_op_excludes: ((inputs?: Target_Op_ExcludesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Op_ExcludesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "includes" |
*
* @param {Target_Op_IncludesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_op_includes: ((inputs?: Target_Op_IncludesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Op_IncludesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "includes any of" |
*
* @param {Target_Op_Includes_AnyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_op_includes_any: ((inputs?: Target_Op_Includes_AnyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Op_Includes_AnyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "includes none of" |
*
* @param {Target_Op_Includes_NoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_op_includes_none: ((inputs?: Target_Op_Includes_NoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Op_Includes_NoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "is" |
*
* @param {Target_Op_IsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_op_is: ((inputs?: Target_Op_IsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Op_IsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "is not" |
*
* @param {Target_Op_Is_NotInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_op_is_not: ((inputs?: Target_Op_Is_NotInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Op_Is_NotInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "is not one of" |
*
* @param {Target_Op_Is_Not_One_OfInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_op_is_not_one_of: ((inputs?: Target_Op_Is_Not_One_OfInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Op_Is_Not_One_OfInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "is one of" |
*
* @param {Target_Op_Is_One_OfInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_op_is_one_of: ((inputs?: Target_Op_Is_One_OfInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Op_Is_One_OfInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Add a rule…" |
*
* @param {Target_Placeholder_Add_RuleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_placeholder_add_rule: ((inputs?: Target_Placeholder_Add_RuleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Placeholder_Add_RuleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "and / or…" |
*
* @param {Target_Placeholder_ConnectorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_placeholder_connector: ((inputs?: Target_Placeholder_ConnectorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Placeholder_ConnectorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "field…" |
*
* @param {Target_Placeholder_FieldInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_placeholder_field: ((inputs?: Target_Placeholder_FieldInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Placeholder_FieldInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "includes…" |
*
* @param {Target_Placeholder_IncludesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_placeholder_includes: ((inputs?: Target_Placeholder_IncludesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Placeholder_IncludesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "is / is not…" |
*
* @param {Target_Placeholder_OperatorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_placeholder_operator: ((inputs?: Target_Placeholder_OperatorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Placeholder_OperatorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "value…" |
*
* @param {Target_Placeholder_ValueInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_placeholder_value: ((inputs?: Target_Placeholder_ValueInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Placeholder_ValueInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Remove rule" |
*
* @param {Target_Remove_RuleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_remove_rule: ((inputs?: Target_Remove_RuleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Remove_RuleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} (removed)" |
*
* @param {Target_RemovedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_removed: ((inputs: Target_RemovedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_RemovedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device" |
*
* @param {Target_Subject_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_subject_device: ((inputs?: Target_Subject_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Subject_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device role" |
*
* @param {Target_Subject_Device_RoleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_subject_device_role: ((inputs?: Target_Subject_Device_RoleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Subject_Device_RoleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device type" |
*
* @param {Target_Subject_Device_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_subject_device_type: ((inputs?: Target_Subject_Device_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Subject_Device_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Group" |
*
* @param {Target_Subject_GroupInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_subject_group: ((inputs?: Target_Subject_GroupInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Subject_GroupInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Reports" |
*
* @param {Target_Subject_ReportedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_subject_reported: ((inputs?: Target_Subject_ReportedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Subject_ReportedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Room" |
*
* @param {Target_Subject_RoomInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_subject_room: ((inputs?: Target_Subject_RoomInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Subject_RoomInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Can set" |
*
* @param {Target_Subject_WritableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_subject_writable: ((inputs?: Target_Subject_WritableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Subject_WritableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Type to filter…" |
*
* @param {Target_Type_FilterInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const target_type_filter: ((inputs?: Target_Type_FilterInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Target_Type_FilterInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Color temperature from warm to cool" |
*
* @param {Temperature_Picker_AriaInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const temperature_picker_aria: ((inputs?: Temperature_Picker_AriaInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Temperature_Picker_AriaInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Just now" |
*
* @param {Time_Just_NowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const time_just_now: ((inputs?: Time_Just_NowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Time_Just_NowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Translation" |
*
* @param {Translation_CardInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const translation_card: ((inputs?: Translation_CardInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Translation_CardInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sets the fixed source language for entities created afterward. Existing names are unchanged." |
*
* @param {Translation_Default_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const translation_default_help: ((inputs?: Translation_Default_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Translation_Default_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Default content language" |
*
* @param {Translation_Default_LanguageInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const translation_default_language: ((inputs?: Translation_Default_LanguageInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Translation_Default_LanguageInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Translations" |
*
* @param {Translation_NamesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const translation_names: ((inputs?: Translation_NamesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Translation_NamesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Source language" |
*
* @param {Translation_Source_LanguageInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const translation_source_language: ((inputs?: Translation_Source_LanguageInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Translation_Source_LanguageInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Translate standard room names" |
*
* @param {Translation_Standard_RoomsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const translation_standard_rooms: ((inputs?: Translation_Standard_RoomsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Translation_Standard_RoomsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Translates recognized common room names as a best effort. Custom names stay unchanged." |
*
* @param {Translation_Standard_Rooms_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const translation_standard_rooms_help: ((inputs?: Translation_Standard_Rooms_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Translation_Standard_Rooms_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Access ID / Client ID" |
*
* @param {Tuya_Access_IdInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_access_id: ((inputs?: Tuya_Access_IdInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Access_IdInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Access Secret / Client Secret" |
*
* @param {Tuya_Access_SecretInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_access_secret: ((inputs?: Tuya_Access_SecretInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Access_SecretInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Check connection" |
*
* @param {Tuya_Check_ConnectionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_check_connection: ((inputs?: Tuya_Check_ConnectionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Check_ConnectionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cloud keys" |
*
* @param {Tuya_Cloud_KeysInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_cloud_keys: ((inputs?: Tuya_Cloud_KeysInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Cloud_KeysInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "3. Connect the app account to the Tuya cloud project." |
*
* @param {Tuya_Cloud_Step_AccountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_cloud_step_account: ((inputs?: Tuya_Cloud_Step_AccountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Cloud_Step_AccountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "1. Connect the device to the Tuya app." |
*
* @param {Tuya_Cloud_Step_AppInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_cloud_step_app: ((inputs?: Tuya_Cloud_Step_AppInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Cloud_Step_AppInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "4. Register the cloud service API keys from Tuya here." |
*
* @param {Tuya_Cloud_Step_KeysInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_cloud_step_keys: ((inputs?: Tuya_Cloud_Step_KeysInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Cloud_Step_KeysInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "2. Set up a Tuya cloud project." |
*
* @param {Tuya_Cloud_Step_ProjectInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_cloud_step_project: ((inputs?: Tuya_Cloud_Step_ProjectInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Cloud_Step_ProjectInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enabled" |
*
* @param {Tuya_EnabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_enabled: ((inputs?: Tuya_EnabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_EnabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Region" |
*
* @param {Tuya_RegionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_region: ((inputs?: Tuya_RegionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_RegionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "China" |
*
* @param {Tuya_Region_CnInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_region_cn: ((inputs?: Tuya_Region_CnInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Region_CnInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "EU Central" |
*
* @param {Tuya_Region_EuInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_region_eu: ((inputs?: Tuya_Region_EuInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Region_EuInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "India" |
*
* @param {Tuya_Region_InInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_region_in: ((inputs?: Tuya_Region_InInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Region_InInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "US" |
*
* @param {Tuya_Region_UsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_region_us: ((inputs?: Tuya_Region_UsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Region_UsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save the Tuya configuration." |
*
* @param {Tuya_Save_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_save_failed: ((inputs?: Tuya_Save_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Save_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Secret set — leave blank to keep" |
*
* @param {Tuya_Secret_KeepInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_secret_keep: ((inputs?: Tuya_Secret_KeepInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Secret_KeepInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Select region" |
*
* @param {Tuya_Select_RegionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_select_region: ((inputs?: Tuya_Select_RegionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Select_RegionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sync devices" |
*
* @param {Tuya_Sync_DevicesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_sync_devices: ((inputs?: Tuya_Sync_DevicesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Sync_DevicesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not sync Tuya devices." |
*
* @param {Tuya_Sync_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_sync_failed: ((inputs?: Tuya_Sync_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_Sync_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} Tuya device synced" |
* | * | "{count} Tuya devices synced" |
*
* @param {Tuya_SyncedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const tuya_synced: ((inputs: Tuya_SyncedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Tuya_SyncedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "You can't delete yourself" |
*
* @param {Users_Cannot_Delete_SelfInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_cannot_delete_self: ((inputs?: Users_Cannot_Delete_SelfInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Cannot_Delete_SelfInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Expires" |
*
* @param {Users_Column_ExpiresInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_column_expires: ((inputs?: Users_Column_ExpiresInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Column_ExpiresInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Users_Column_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_column_name: ((inputs?: Users_Column_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Column_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Type" |
*
* @param {Users_Column_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_column_type: ((inputs?: Users_Column_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Column_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Username" |
*
* @param {Users_Column_UsernameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_column_username: ((inputs?: Users_Column_UsernameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Column_UsernameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create user" |
*
* @param {Users_CreateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_create: ((inputs?: Users_CreateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_CreateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Every user has full administrator access." |
*
* @param {Users_Create_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_create_description: ((inputs?: Users_Create_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Create_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not create the user." |
*
* @param {Users_Create_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_create_failed: ((inputs?: Users_Create_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Create_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create" |
*
* @param {Users_Create_ShortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_create_short: ((inputs?: Users_Create_ShortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Create_ShortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "User created" |
*
* @param {Users_CreatedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_created: ((inputs?: Users_CreatedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_CreatedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Creating…" |
*
* @param {Users_CreatingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_creating: ((inputs?: Users_CreatingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_CreatingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This permanently removes {name}. Resources they created (scenes, automations, groups, and rooms) stay, with their attribution cleared." |
*
* @param {Users_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_delete_description: ((inputs: Users_Delete_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Delete_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the user." |
*
* @param {Users_Delete_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_delete_failed: ((inputs?: Users_Delete_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Delete_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This removes the selected accounts. Resources created by users stay, with their attribution cleared." |
*
* @param {Users_Delete_Many_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_delete_many_description: ((inputs?: Users_Delete_Many_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Delete_Many_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the accounts." |
*
* @param {Users_Delete_Many_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_delete_many_failed: ((inputs?: Users_Delete_Many_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Delete_Many_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Delete {count} account?" |
* | * | "Delete {count} accounts?" |
*
* @param {Users_Delete_Many_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_delete_many_title: ((inputs: Users_Delete_Many_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Delete_Many_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete user" |
*
* @param {Users_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_delete_title: ((inputs?: Users_Delete_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Delete_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{name} deleted" |
*
* @param {Users_DeletedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_deleted: ((inputs: Users_DeletedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_DeletedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} account deleted" |
* | * | "{count} accounts deleted" |
*
* @param {Users_Deleted_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_deleted_count: ((inputs: Users_Deleted_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Deleted_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Deleting…" |
*
* @param {Users_DeletingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_deleting: ((inputs?: Users_DeletingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_DeletingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Display name" |
*
* @param {Users_Display_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_display_name: ((inputs?: Users_Display_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Display_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Loading users and guests…" |
*
* @param {Users_Loading_AccountsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_loading_accounts: ((inputs?: Users_Loading_AccountsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Loading_AccountsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "New password" |
*
* @param {Users_New_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_new_password: ((inputs?: Users_New_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_New_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No users or guests match." |
*
* @param {Users_No_Account_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_no_account_match: ((inputs?: Users_No_Account_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_No_Account_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Password reset for {name}" |
*
* @param {Users_Password_ResetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_password_reset: ((inputs: Users_Password_ResetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Password_ResetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Set a new password for {name}." |
*
* @param {Users_Reset_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_reset_description: ((inputs: Users_Reset_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Reset_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not reset the password." |
*
* @param {Users_Reset_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_reset_failed: ((inputs?: Users_Reset_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Reset_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Reset password" |
*
* @param {Users_Reset_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_reset_password: ((inputs?: Users_Reset_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Reset_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Saving…" |
*
* @param {Users_SavingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_saving: ((inputs?: Users_SavingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_SavingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search users and guests…" |
*
* @param {Users_Search_AccountsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_search_accounts: ((inputs?: Users_Search_AccountsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_Search_AccountsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "User" |
*
* @param {Users_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const users_type: ((inputs?: Users_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Users_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Abnormal" |
*
* @param {Value_AbnormalInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_abnormal: ((inputs?: Value_AbnormalInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_AbnormalInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Auto" |
*
* @param {Value_AutoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_auto: ((inputs?: Value_AutoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_AutoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Back" |
*
* @param {Value_BackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_back: ((inputs?: Value_BackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_BackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Both" |
*
* @param {Value_BothInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_both: ((inputs?: Value_BothInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_BothInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cool" |
*
* @param {Value_CoolInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_cool: ((inputs?: Value_CoolInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_CoolInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Down" |
*
* @param {Value_DownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_down: ((inputs?: Value_DownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_DownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Dry" |
*
* @param {Value_DryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_dry: ((inputs?: Value_DryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_DryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "False" |
*
* @param {Value_FalseInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_false: ((inputs?: Value_FalseInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_FalseInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Fan" |
*
* @param {Value_FanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_fan: ((inputs?: Value_FanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_FanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Fan only" |
*
* @param {Value_Fan_OnlyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_fan_only: ((inputs?: Value_Fan_OnlyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_Fan_OnlyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Front" |
*
* @param {Value_FrontInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_front: ((inputs?: Value_FrontInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_FrontInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Heat" |
*
* @param {Value_HeatInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_heat: ((inputs?: Value_HeatInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_HeatInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "High" |
*
* @param {Value_HighInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_high: ((inputs?: Value_HighInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_HighInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Left" |
*
* @param {Value_LeftInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_left: ((inputs?: Value_LeftInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_LeftInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Low" |
*
* @param {Value_LowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_low: ((inputs?: Value_LowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_LowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Medium" |
*
* @param {Value_MidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_mid: ((inputs?: Value_MidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_MidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Normal" |
*
* @param {Value_NormalInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_normal: ((inputs?: Value_NormalInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_NormalInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Right" |
*
* @param {Value_RightInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_right: ((inputs?: Value_RightInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_RightInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Tilt" |
*
* @param {Value_TiltInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_tilt: ((inputs?: Value_TiltInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_TiltInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "True" |
*
* @param {Value_TrueInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_true: ((inputs?: Value_TrueInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_TrueInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Up" |
*
* @param {Value_UpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const value_up: ((inputs?: Value_UpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Value_UpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not build this vibe." |
*
* @param {Vibe_Build_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_build_failed: ((inputs?: Vibe_Build_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Build_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Building…" |
*
* @param {Vibe_BuildingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_building: ((inputs?: Vibe_BuildingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_BuildingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Atmosphere" |
*
* @param {Vibe_Category_AtmosphereInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_category_atmosphere: ((inputs?: Vibe_Category_AtmosphereInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Category_AtmosphereInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Nature" |
*
* @param {Vibe_Category_NatureInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_category_nature: ((inputs?: Vibe_Category_NatureInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Category_NatureInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{id}" |
*
* @param {Vibe_Category_UnknownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_category_unknown: ((inputs: Vibe_Category_UnknownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Category_UnknownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Whites" |
*
* @param {Vibe_Category_WhitesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_category_whites: ((inputs?: Vibe_Category_WhitesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Category_WhitesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not load the next choices." |
*
* @param {Vibe_Choices_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_choices_failed: ((inputs?: Vibe_Choices_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Choices_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guided vibe choices {round}" |
*
* @param {Vibe_Choices_RoundInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_choices_round: ((inputs: Vibe_Choices_RoundInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Choices_RoundInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose what feels closest" |
*
* @param {Vibe_Choose_ClosestInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_choose_closest: ((inputs?: Vibe_Choose_ClosestInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Choose_ClosestInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose a photo" |
*
* @param {Vibe_Choose_PhotoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_choose_photo: ((inputs?: Vibe_Choose_PhotoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Choose_PhotoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Colors" |
*
* @param {Vibe_ColorsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_colors: ((inputs?: Vibe_ColorsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_ColorsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Full color" |
*
* @param {Vibe_Domain_Full_ColorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_domain_full_color: ((inputs?: Vibe_Domain_Full_ColorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Domain_Full_ColorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "White ambience" |
*
* @param {Vibe_Domain_White_AmbienceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_domain_white_ambience: ((inputs?: Vibe_Domain_White_AmbienceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Domain_White_AmbienceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Gallery" |
*
* @param {Vibe_GalleryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_gallery: ((inputs?: Vibe_GalleryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_GalleryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Amber" |
*
* @param {Vibe_Guide_AmberInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_amber: ((inputs?: Vibe_Guide_AmberInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_AmberInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Balanced" |
*
* @param {Vibe_Guide_BalancedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_balanced: ((inputs?: Vibe_Guide_BalancedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_BalancedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Brighter" |
*
* @param {Vibe_Guide_BrighterInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_brighter: ((inputs?: Vibe_Guide_BrighterInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_BrighterInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Candlelight" |
*
* @param {Vibe_Guide_CandlelightInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_candlelight: ((inputs?: Vibe_Guide_CandlelightInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_CandlelightInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cool" |
*
* @param {Vibe_Guide_CoolInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_cool: ((inputs?: Vibe_Guide_CoolInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_CoolInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cooler" |
*
* @param {Vibe_Guide_CoolerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_cooler: ((inputs?: Vibe_Guide_CoolerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_CoolerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Daylight" |
*
* @param {Vibe_Guide_DaylightInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_daylight: ((inputs?: Vibe_Guide_DaylightInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_DaylightInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Ember" |
*
* @param {Vibe_Guide_EmberInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_ember: ((inputs?: Vibe_Guide_EmberInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_EmberInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Gold" |
*
* @param {Vibe_Guide_GoldInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_gold: ((inputs?: Vibe_Guide_GoldInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_GoldInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Indigo" |
*
* @param {Vibe_Guide_IndigoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_indigo: ((inputs?: Vibe_Guide_IndigoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_IndigoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Lagoon" |
*
* @param {Vibe_Guide_LagoonInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_lagoon: ((inputs?: Vibe_Guide_LagoonInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_LagoonInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Leaf" |
*
* @param {Vibe_Guide_LeafInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_leaf: ((inputs?: Vibe_Guide_LeafInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_LeafInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Meadow" |
*
* @param {Vibe_Guide_MeadowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_meadow: ((inputs?: Vibe_Guide_MeadowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_MeadowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Mint" |
*
* @param {Vibe_Guide_MintInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_mint: ((inputs?: Vibe_Guide_MintInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_MintInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Neutral" |
*
* @param {Vibe_Guide_NeutralInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_neutral: ((inputs?: Vibe_Guide_NeutralInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_NeutralInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Orchid" |
*
* @param {Vibe_Guide_OrchidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_orchid: ((inputs?: Vibe_Guide_OrchidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_OrchidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rose" |
*
* @param {Vibe_Guide_RoseInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_rose: ((inputs?: Vibe_Guide_RoseInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_RoseInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sky" |
*
* @param {Vibe_Guide_SkyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_sky: ((inputs?: Vibe_Guide_SkyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_SkyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Softer" |
*
* @param {Vibe_Guide_SofterInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_softer: ((inputs?: Vibe_Guide_SofterInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_SofterInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choice {id}" |
*
* @param {Vibe_Guide_UnknownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_unknown: ((inputs: Vibe_Guide_UnknownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_UnknownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Violet" |
*
* @param {Vibe_Guide_VioletInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_violet: ((inputs?: Vibe_Guide_VioletInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_VioletInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Warm" |
*
* @param {Vibe_Guide_WarmInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_warm: ((inputs?: Vibe_Guide_WarmInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_WarmInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Warmer" |
*
* @param {Vibe_Guide_WarmerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guide_warmer: ((inputs?: Vibe_Guide_WarmerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Guide_WarmerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Guided" |
*
* @param {Vibe_GuidedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_guided: ((inputs?: Vibe_GuidedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_GuidedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not load the Vibe gallery." |
*
* @param {Vibe_Load_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_load_failed: ((inputs?: Vibe_Load_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Load_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Loading choices" |
*
* @param {Vibe_Loading_ChoicesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_loading_choices: ((inputs?: Vibe_Loading_ChoicesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Loading_ChoicesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Photo" |
*
* @param {Vibe_PhotoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_photo: ((inputs?: Vibe_PhotoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_PhotoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not process this image." |
*
* @param {Vibe_Photo_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_photo_failed: ((inputs?: Vibe_Photo_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Photo_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Aurora Haze" |
*
* @param {Vibe_Preset_Aurora_HazeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preset_aurora_haze: ((inputs?: Vibe_Preset_Aurora_HazeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preset_Aurora_HazeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Candlelight" |
*
* @param {Vibe_Preset_CandlelightInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preset_candlelight: ((inputs?: Vibe_Preset_CandlelightInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preset_CandlelightInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cool Morning" |
*
* @param {Vibe_Preset_Cool_MorningInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preset_cool_morning: ((inputs?: Vibe_Preset_Cool_MorningInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preset_Cool_MorningInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Ember Hearth" |
*
* @param {Vibe_Preset_Ember_HearthInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preset_ember_hearth: ((inputs?: Vibe_Preset_Ember_HearthInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preset_Ember_HearthInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Forest Canopy" |
*
* @param {Vibe_Preset_Forest_CanopyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preset_forest_canopy: ((inputs?: Vibe_Preset_Forest_CanopyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preset_Forest_CanopyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Neutral Focus" |
*
* @param {Vibe_Preset_Neutral_FocusInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preset_neutral_focus: ((inputs?: Vibe_Preset_Neutral_FocusInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preset_Neutral_FocusInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Night Sky" |
*
* @param {Vibe_Preset_Night_SkyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preset_night_sky: ((inputs?: Vibe_Preset_Night_SkyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preset_Night_SkyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Ocean Drift" |
*
* @param {Vibe_Preset_Ocean_DriftInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preset_ocean_drift: ((inputs?: Vibe_Preset_Ocean_DriftInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preset_Ocean_DriftInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Sunset Glow" |
*
* @param {Vibe_Preset_Sunset_GlowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preset_sunset_glow: ((inputs?: Vibe_Preset_Sunset_GlowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preset_Sunset_GlowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Preset {id}" |
*
* @param {Vibe_Preset_UnknownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preset_unknown: ((inputs: Vibe_Preset_UnknownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preset_UnknownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Warm Evening" |
*
* @param {Vibe_Preset_Warm_EveningInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preset_warm_evening: ((inputs?: Vibe_Preset_Warm_EveningInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preset_Warm_EveningInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Lighting preview" |
*
* @param {Vibe_Preview_Aria_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preview_aria_empty: ((inputs?: Vibe_Preview_Aria_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preview_Aria_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Lighting preview with {count} representative color" |
* | * | "Lighting preview with {count} representative colors" |
*
* @param {Vibe_Preview_Aria_SwatchesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_preview_aria_swatches: ((inputs: Vibe_Preview_Aria_SwatchesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Preview_Aria_SwatchesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Replace photo" |
*
* @param {Vibe_Replace_PhotoInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_replace_photo: ((inputs?: Vibe_Replace_PhotoInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Replace_PhotoInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Start from a curated lighting Vibe." |
*
* @param {Vibe_Source_Gallery_DetailInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_source_gallery_detail: ((inputs?: Vibe_Source_Gallery_DetailInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Source_Gallery_DetailInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Build a Vibe through three to five visual choices." |
*
* @param {Vibe_Source_Guided_DetailInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_source_guided_detail: ((inputs?: Vibe_Source_Guided_DetailInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Source_Guided_DetailInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Individual lights" |
*
* @param {Vibe_Source_IndividualInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_source_individual: ((inputs?: Vibe_Source_IndividualInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Source_IndividualInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Choose exact states for lights and devices." |
*
* @param {Vibe_Source_Individual_DetailInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_source_individual_detail: ((inputs?: Vibe_Source_Individual_DetailInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Source_Individual_DetailInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Turn the color atmosphere of an image into light." |
*
* @param {Vibe_Source_Photo_DetailInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_source_photo_detail: ((inputs?: Vibe_Source_Photo_DetailInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_Source_Photo_DetailInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Use this vibe" |
*
* @param {Vibe_UseInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_use: ((inputs?: Vibe_UseInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_UseInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Whites" |
*
* @param {Vibe_WhitesInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const vibe_whites: ((inputs?: Vibe_WhitesInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Vibe_WhitesInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Accept incoming requests" |
*
* @param {Webhooks_Accept_RequestsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_accept_requests: ((inputs?: Webhooks_Accept_RequestsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Accept_RequestsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "{count} automation" |
* | * | "{count} automations" |
*
* @param {Webhooks_Automation_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_automation_count: ((inputs: Webhooks_Automation_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Automation_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Request body copied" |
*
* @param {Webhooks_Body_CopiedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_body_copied: ((inputs?: Webhooks_Body_CopiedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Body_CopiedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Body unavailable for this request." |
*
* @param {Webhooks_Body_UnavailableInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_body_unavailable: ((inputs?: Webhooks_Body_UnavailableInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Body_UnavailableInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Automations" |
*
* @param {Webhooks_Column_AutomationsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_column_automations: ((inputs?: Webhooks_Column_AutomationsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Column_AutomationsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Created by" |
*
* @param {Webhooks_Column_Created_ByInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_column_created_by: ((inputs?: Webhooks_Column_Created_ByInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Column_Created_ByInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last request" |
*
* @param {Webhooks_Column_Last_RequestInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_column_last_request: ((inputs?: Webhooks_Column_Last_RequestInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Column_Last_RequestInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Name" |
*
* @param {Webhooks_Column_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_column_name: ((inputs?: Webhooks_Column_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Column_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Content" |
*
* @param {Webhooks_ContentInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_content: ((inputs?: Webhooks_ContentInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_ContentInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Copied" |
*
* @param {Webhooks_CopiedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_copied: ((inputs?: Webhooks_CopiedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_CopiedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Copy request body" |
*
* @param {Webhooks_Copy_BodyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_copy_body: ((inputs?: Webhooks_Copy_BodyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Copy_BodyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Copy webhook URL" |
*
* @param {Webhooks_Copy_UrlInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_copy_url: ((inputs?: Webhooks_Copy_UrlInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Copy_UrlInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create webhook" |
*
* @param {Webhooks_CreateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_create: ((inputs?: Webhooks_CreateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_CreateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create an endpoint for one logical external event." |
*
* @param {Webhooks_Create_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_create_description: ((inputs?: Webhooks_Create_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Create_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not create the webhook." |
*
* @param {Webhooks_Create_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_create_failed: ((inputs?: Webhooks_Create_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Create_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create your first webhook" |
*
* @param {Webhooks_Create_FirstInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_create_first: ((inputs?: Webhooks_Create_FirstInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Create_FirstInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create" |
*
* @param {Webhooks_Create_ShortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_create_short: ((inputs?: Webhooks_Create_ShortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Create_ShortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Creating…" |
*
* @param {Webhooks_CreatingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_creating: ((inputs?: Webhooks_CreatingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_CreatingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete “{name}”? This action cannot be undone." |
*
* @param {Webhooks_Delete_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_delete_description: ((inputs: Webhooks_Delete_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Delete_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the webhook." |
*
* @param {Webhooks_Delete_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_delete_failed: ((inputs?: Webhooks_Delete_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Delete_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not delete the webhooks." |
*
* @param {Webhooks_Delete_Many_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_delete_many_failed: ((inputs?: Webhooks_Delete_Many_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Delete_Many_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete webhooks" |
*
* @param {Webhooks_Delete_Many_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_delete_many_title: ((inputs?: Webhooks_Delete_Many_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Delete_Many_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | countPlural | output |
* | --- | --- |
* | "one" | "Delete {count} webhook and their delivery history? This cannot be undone." |
* | * | "Delete {count} webhooks and their delivery history? This cannot be undone." |
*
* @param {Webhooks_Delete_Many_With_HistoryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_delete_many_with_history: ((inputs: Webhooks_Delete_Many_With_HistoryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Delete_Many_With_HistoryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete {name}" |
*
* @param {Webhooks_Delete_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_delete_named: ((inputs: Webhooks_Delete_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Delete_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete webhook" |
*
* @param {Webhooks_Delete_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_delete_title: ((inputs?: Webhooks_Delete_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Delete_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Some webhooks are used by automations and were kept." |
*
* @param {Webhooks_Delete_Used_KeptInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_delete_used_kept: ((inputs?: Webhooks_Delete_Used_KeptInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Delete_Used_KeptInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Delete “{name}” and its delivery history? This cannot be undone." |
*
* @param {Webhooks_Delete_With_HistoryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_delete_with_history: ((inputs: Webhooks_Delete_With_HistoryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Delete_With_HistoryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhook" |
*
* @param {Webhooks_Detail_FallbackInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_detail_fallback: ((inputs?: Webhooks_Detail_FallbackInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Detail_FallbackInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Disable {name}" |
*
* @param {Webhooks_Disable_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_disable_named: ((inputs: Webhooks_Disable_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Disable_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Disabled" |
*
* @param {Webhooks_DisabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_disabled: ((inputs?: Webhooks_DisabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_DisabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Done" |
*
* @param {Webhooks_DoneInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_done: ((inputs?: Webhooks_DoneInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_DoneInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Duration" |
*
* @param {Webhooks_DurationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_duration: ((inputs?: Webhooks_DurationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_DurationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Edit {name}" |
*
* @param {Webhooks_Edit_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_edit_named: ((inputs: Webhooks_Edit_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Edit_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No incoming webhooks yet." |
*
* @param {Webhooks_EmptyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_empty: ((inputs?: Webhooks_EmptyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_EmptyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Create an endpoint for another system to trigger Hive." |
*
* @param {Webhooks_Empty_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_empty_help: ((inputs?: Webhooks_Empty_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Empty_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enable {name}" |
*
* @param {Webhooks_Enable_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_enable_named: ((inputs: Webhooks_Enable_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Enable_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enabled" |
*
* @param {Webhooks_EnabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_enabled: ((inputs?: Webhooks_EnabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_EnabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Status" |
*
* @param {Webhooks_Filter_StatusInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_filter_status: ((inputs?: Webhooks_Filter_StatusInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Filter_StatusInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Usage" |
*
* @param {Webhooks_Filter_UsageInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_filter_usage: ((inputs?: Webhooks_Filter_UsageInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Filter_UsageInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Headers" |
*
* @param {Webhooks_HeadersInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_headers: ((inputs?: Webhooks_HeadersInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_HeadersInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Latest {count}" |
*
* @param {Webhooks_Latest_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_latest_count: ((inputs: Webhooks_Latest_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Latest_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhook name" |
*
* @param {Webhooks_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_name: ((inputs?: Webhooks_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Pipeline failed" |
*
* @param {Webhooks_Name_PlaceholderInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_name_placeholder: ((inputs?: Webhooks_Name_PlaceholderInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Name_PlaceholderInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No automations use this webhook." |
*
* @param {Webhooks_No_AutomationsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_no_automations: ((inputs?: Webhooks_No_AutomationsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_No_AutomationsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No content type" |
*
* @param {Webhooks_No_Content_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_no_content_type: ((inputs?: Webhooks_No_Content_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_No_Content_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No webhooks match your filters." |
*
* @param {Webhooks_No_MatchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_no_match: ((inputs?: Webhooks_No_MatchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_No_MatchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No requests received yet." |
*
* @param {Webhooks_No_RequestsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_no_requests: ((inputs?: Webhooks_No_RequestsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_No_RequestsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhook not found." |
*
* @param {Webhooks_Not_FoundInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_not_found: ((inputs?: Webhooks_Not_FoundInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Not_FoundInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Accepted" |
*
* @param {Webhooks_Outcome_AcceptedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_outcome_accepted: ((inputs?: Webhooks_Outcome_AcceptedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Outcome_AcceptedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Disabled" |
*
* @param {Webhooks_Outcome_DisabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_outcome_disabled: ((inputs?: Webhooks_Outcome_DisabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Outcome_DisabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Invalid JSON" |
*
* @param {Webhooks_Outcome_Invalid_JsonInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_outcome_invalid_json: ((inputs?: Webhooks_Outcome_Invalid_JsonInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Outcome_Invalid_JsonInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rate limited" |
*
* @param {Webhooks_Outcome_Rate_LimitedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_outcome_rate_limited: ((inputs?: Webhooks_Outcome_Rate_LimitedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Outcome_Rate_LimitedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Too large" |
*
* @param {Webhooks_Outcome_Too_LargeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_outcome_too_large: ((inputs?: Webhooks_Outcome_Too_LargeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Outcome_Too_LargeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unknown ({outcome})" |
*
* @param {Webhooks_Outcome_UnknownInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_outcome_unknown: ((inputs: Webhooks_Outcome_UnknownInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Outcome_UnknownInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Query keys" |
*
* @param {Webhooks_Query_KeysInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_query_keys: ((inputs?: Webhooks_Query_KeysInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Query_KeysInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Received" |
*
* @param {Webhooks_ReceivedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_received: ((inputs?: Webhooks_ReceivedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_ReceivedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Recent requests" |
*
* @param {Webhooks_Recent_RequestsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_recent_requests: ((inputs?: Webhooks_Recent_RequestsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Recent_RequestsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not rename the webhook." |
*
* @param {Webhooks_Rename_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_rename_failed: ((inputs?: Webhooks_Rename_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Rename_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Request body" |
*
* @param {Webhooks_Request_BodyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_request_body: ((inputs?: Webhooks_Request_BodyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Request_BodyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Request ID" |
*
* @param {Webhooks_Request_IdInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_request_id: ((inputs?: Webhooks_Request_IdInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Request_IdInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Requests" |
*
* @param {Webhooks_RequestsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_requests: ((inputs?: Webhooks_RequestsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_RequestsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Result" |
*
* @param {Webhooks_ResultInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_result: ((inputs?: Webhooks_ResultInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_ResultInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "The current URL stops working immediately. The replacement is shown once." |
*
* @param {Webhooks_Rotate_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_rotate_description: ((inputs?: Webhooks_Rotate_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Rotate_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not rotate the webhook URL." |
*
* @param {Webhooks_Rotate_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_rotate_failed: ((inputs?: Webhooks_Rotate_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Rotate_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rotate" |
*
* @param {Webhooks_Rotate_ShortInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_rotate_short: ((inputs?: Webhooks_Rotate_ShortInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Rotate_ShortInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rotate webhook URL" |
*
* @param {Webhooks_Rotate_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_rotate_title: ((inputs?: Webhooks_Rotate_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Rotate_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Rotate URL" |
*
* @param {Webhooks_Rotate_UrlInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_rotate_url: ((inputs?: Webhooks_Rotate_UrlInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Rotate_UrlInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save the webhook." |
*
* @param {Webhooks_Save_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_save_failed: ((inputs?: Webhooks_Save_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Save_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search webhooks…" |
*
* @param {Webhooks_SearchInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_search: ((inputs?: Webhooks_SearchInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_SearchInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Search automations…" |
*
* @param {Webhooks_Search_AutomationsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_search_automations: ((inputs?: Webhooks_Search_AutomationsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Search_AutomationsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Size" |
*
* @param {Webhooks_SizeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_size: ((inputs?: Webhooks_SizeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_SizeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Source IP" |
*
* @param {Webhooks_Source_IpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_source_ip: ((inputs?: Webhooks_Source_IpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Source_IpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhooks" |
*
* @param {Webhooks_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_title: ((inputs?: Webhooks_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unused" |
*
* @param {Webhooks_UnusedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_unused: ((inputs?: Webhooks_UnusedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_UnusedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not update the webhook." |
*
* @param {Webhooks_Update_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_update_failed: ((inputs?: Webhooks_Update_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Update_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "This URL is shown once. Store it in the calling system before closing." |
*
* @param {Webhooks_Url_OnceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_url_once: ((inputs?: Webhooks_Url_OnceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Url_OnceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Webhook URL" |
*
* @param {Webhooks_Url_TitleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_url_title: ((inputs?: Webhooks_Url_TitleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Url_TitleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Used" |
*
* @param {Webhooks_UsedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_used: ((inputs?: Webhooks_UsedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_UsedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Used by" |
*
* @param {Webhooks_Used_ByInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_used_by: ((inputs?: Webhooks_Used_ByInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Used_ByInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Used by an automation" |
*
* @param {Webhooks_Used_By_AutomationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_used_by_automation: ((inputs?: Webhooks_Used_By_AutomationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Used_By_AutomationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "User agent" |
*
* @param {Webhooks_User_AgentInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_user_agent: ((inputs?: Webhooks_User_AgentInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_User_AgentInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enter a name" |
*
* @param {Webhooks_Validation_NameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_validation_name: ((inputs?: Webhooks_Validation_NameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Validation_NameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Use at least 1 request" |
*
* @param {Webhooks_Validation_Request_CountInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_validation_request_count: ((inputs?: Webhooks_Validation_Request_CountInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Validation_Request_CountInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Use at least 1 millisecond" |
*
* @param {Webhooks_Validation_WindowInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_validation_window: ((inputs?: Webhooks_Validation_WindowInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Validation_WindowInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "View request body" |
*
* @param {Webhooks_View_BodyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_view_body: ((inputs?: Webhooks_View_BodyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_View_BodyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Window (ms)" |
*
* @param {Webhooks_Window_MsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const webhooks_window_ms: ((inputs?: Webhooks_Window_MsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Webhooks_Window_MsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Adapter" |
*
* @param {Zigbee_AdapterInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_adapter: ((inputs?: Zigbee_AdapterInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_AdapterInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Address vendor" |
*
* @param {Zigbee_Address_VendorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_address_vendor: ((inputs?: Zigbee_Address_VendorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Address_VendorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Attribute" |
*
* @param {Zigbee_AttributeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_attribute: ((inputs?: Zigbee_AttributeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_AttributeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Battery type" |
*
* @param {Zigbee_Battery_TypeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_battery_type: ((inputs?: Zigbee_Battery_TypeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Battery_TypeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Bindings" |
*
* @param {Zigbee_BindingsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_bindings: ((inputs?: Zigbee_BindingsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_BindingsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Broker address" |
*
* @param {Zigbee_Broker_AddressInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_broker_address: ((inputs?: Zigbee_Broker_AddressInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Broker_AddressInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Change" |
*
* @param {Zigbee_ChangeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_change: ((inputs?: Zigbee_ChangeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_ChangeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Channel" |
*
* @param {Zigbee_ChannelInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_channel: ((inputs?: Zigbee_ChannelInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_ChannelInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Check connection" |
*
* @param {Zigbee_Check_ConnectionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_check_connection: ((inputs?: Zigbee_Check_ConnectionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Check_ConnectionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Cluster" |
*
* @param {Zigbee_ClusterInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_cluster: ((inputs?: Zigbee_ClusterInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_ClusterInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Command traffic" |
*
* @param {Zigbee_Command_TrafficInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_command_traffic: ((inputs?: Zigbee_Command_TrafficInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Command_TrafficInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About command traffic" |
*
* @param {Zigbee_Command_Traffic_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_command_traffic_about: ((inputs?: Zigbee_Command_Traffic_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Command_Traffic_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Interactive work includes controls, automations, and applying a scene. Continuous work keeps moving scenes in motion and yields while interactive work is wai..." |
*
* @param {Zigbee_Command_Traffic_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_command_traffic_help: ((inputs?: Zigbee_Command_Traffic_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Command_Traffic_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Commit" |
*
* @param {Zigbee_CommitInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_commit: ((inputs?: Zigbee_CommitInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_CommitInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not save the Zigbee2MQTT configuration." |
*
* @param {Zigbee_Config_Save_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_config_save_failed: ((inputs?: Zigbee_Config_Save_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Config_Save_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "3. Enable Zigbee2MQTT's availability feature for online and offline state." |
*
* @param {Zigbee_Connect_Step_AvailabilityInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_connect_step_availability: ((inputs?: Zigbee_Connect_Step_AvailabilityInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Connect_Step_AvailabilityInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "1. Point Hive at the same MQTT broker your Zigbee2MQTT instance publishes to." |
*
* @param {Zigbee_Connect_Step_BrokerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_connect_step_broker: ((inputs?: Zigbee_Connect_Step_BrokerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Connect_Step_BrokerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "2. Hive reads the device registry from zigbee2mqtt/bridge/devices." |
*
* @param {Zigbee_Connect_Step_RegistryInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_connect_step_registry: ((inputs?: Zigbee_Connect_Step_RegistryInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Connect_Step_RegistryInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Connecting" |
*
* @param {Zigbee_ConnectingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_connecting: ((inputs?: Zigbee_ConnectingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_ConnectingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Continuous commands per second" |
*
* @param {Zigbee_Continuous_RateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_continuous_rate: ((inputs?: Zigbee_Continuous_RateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Continuous_RateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About continuous command rate" |
*
* @param {Zigbee_Continuous_Rate_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_continuous_rate_about: ((inputs?: Zigbee_Continuous_Rate_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Continuous_Rate_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Background updates that keep moving scenes in motion. They yield while interactive commands are waiting." |
*
* @param {Zigbee_Continuous_Rate_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_continuous_rate_help: ((inputs?: Zigbee_Continuous_Rate_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Continuous_Rate_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Converters" |
*
* @param {Zigbee_ConvertersInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_converters: ((inputs?: Zigbee_ConvertersInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_ConvertersInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Coordinator" |
*
* @param {Zigbee_CoordinatorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_coordinator: ((inputs?: Zigbee_CoordinatorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_CoordinatorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Date code" |
*
* @param {Zigbee_Date_CodeInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_date_code: ((inputs?: Zigbee_Date_CodeInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Date_CodeInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Definition" |
*
* @param {Zigbee_DefinitionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_definition: ((inputs?: Zigbee_DefinitionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_DefinitionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Description" |
*
* @param {Zigbee_DescriptionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_description: ((inputs?: Zigbee_DescriptionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_DescriptionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Details" |
*
* @param {Zigbee_DetailsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_details: ((inputs?: Zigbee_DetailsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_DetailsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Device" |
*
* @param {Zigbee_DeviceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_device: ((inputs?: Zigbee_DeviceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_DeviceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enabled" |
*
* @param {Zigbee_EnabledInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_enabled: ((inputs?: Zigbee_EnabledInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_EnabledInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Endpoint" |
*
* @param {Zigbee_EndpointInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_endpoint: ((inputs?: Zigbee_EndpointInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_EndpointInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Endpoint {id}" |
*
* @param {Zigbee_Endpoint_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_endpoint_named: ((inputs: Zigbee_Endpoint_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Endpoint_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Endpoints" |
*
* @param {Zigbee_EndpointsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_endpoints: ((inputs?: Zigbee_EndpointsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_EndpointsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Extended PAN ID" |
*
* @param {Zigbee_Extended_Pan_IdInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_extended_pan_id: ((inputs?: Zigbee_Extended_Pan_IdInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Extended_Pan_IdInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Firmware" |
*
* @param {Zigbee_FirmwareInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_firmware: ((inputs?: Zigbee_FirmwareInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_FirmwareInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Zigbee2MQTT frontend URL" |
*
* @param {Zigbee_Frontend_UrlInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_frontend_url: ((inputs?: Zigbee_Frontend_UrlInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Frontend_UrlInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Optional. Used for links into Zigbee2MQTT." |
*
* @param {Zigbee_Frontend_Url_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_frontend_url_help: ((inputs?: Zigbee_Frontend_Url_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Frontend_Url_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Enter a valid HTTP or HTTPS URL." |
*
* @param {Zigbee_Frontend_Url_InvalidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_frontend_url_invalid: ((inputs?: Zigbee_Frontend_Url_InvalidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Frontend_Url_InvalidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Use an HTTP or HTTPS URL without credentials, query, or fragment." |
*
* @param {Zigbee_Frontend_Url_RestrictedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_frontend_url_restricted: ((inputs?: Zigbee_Frontend_Url_RestrictedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Frontend_Url_RestrictedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Group ID" |
*
* @param {Zigbee_Group_IdInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_group_id: ((inputs?: Zigbee_Group_IdInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Group_IdInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Group {id}" |
*
* @param {Zigbee_Group_NamedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_group_named: ((inputs: Zigbee_Group_NamedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Group_NamedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Groups" |
*
* @param {Zigbee_GroupsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_groups: ((inputs?: Zigbee_GroupsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_GroupsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "IEEE address" |
*
* @param {Zigbee_Ieee_AddressInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_ieee_address: ((inputs?: Zigbee_Ieee_AddressInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Ieee_AddressInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Input clusters" |
*
* @param {Zigbee_Input_ClustersInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_input_clusters: ((inputs?: Zigbee_Input_ClustersInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Input_ClustersInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Integration" |
*
* @param {Zigbee_IntegrationInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_integration: ((inputs?: Zigbee_IntegrationInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_IntegrationInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Interactive commands per second" |
*
* @param {Zigbee_Interactive_RateInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_interactive_rate: ((inputs?: Zigbee_Interactive_RateInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Interactive_RateInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About interactive command rate" |
*
* @param {Zigbee_Interactive_Rate_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_interactive_rate_about: ((inputs?: Zigbee_Interactive_Rate_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Interactive_Rate_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Commands from controls, automations, and applying scenes. They take priority over continuous updates." |
*
* @param {Zigbee_Interactive_Rate_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_interactive_rate_help: ((inputs?: Zigbee_Interactive_Rate_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Interactive_Rate_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Interview" |
*
* @param {Zigbee_InterviewInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_interview: ((inputs?: Zigbee_InterviewInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_InterviewInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Last scanned {time}" |
*
* @param {Zigbee_Last_ScannedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_last_scanned: ((inputs: Zigbee_Last_ScannedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Last_ScannedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Manufacturer" |
*
* @param {Zigbee_ManufacturerInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_manufacturer: ((inputs?: Zigbee_ManufacturerInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_ManufacturerInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Max" |
*
* @param {Zigbee_MaxInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_max: ((inputs?: Zigbee_MaxInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_MaxInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Min" |
*
* @param {Zigbee_MinInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_min: ((inputs?: Zigbee_MinInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_MinInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Model" |
*
* @param {Zigbee_ModelInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_model: ((inputs?: Zigbee_ModelInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_ModelInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Model ID" |
*
* @param {Zigbee_Model_IdInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_model_id: ((inputs?: Zigbee_Model_IdInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Model_IdInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "MQTT topic" |
*
* @param {Zigbee_Mqtt_TopicInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_mqtt_topic: ((inputs?: Zigbee_Mqtt_TopicInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Mqtt_TopicInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Network" |
*
* @param {Zigbee_NetworkInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_network: ((inputs?: Zigbee_NetworkInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_NetworkInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Network address" |
*
* @param {Zigbee_Network_AddressInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_network_address: ((inputs?: Zigbee_Network_AddressInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Network_AddressInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Network role" |
*
* @param {Zigbee_Network_RoleInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_network_role: ((inputs?: Zigbee_Network_RoleInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Network_RoleInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Never scanned" |
*
* @param {Zigbee_Never_ScannedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_never_scanned: ((inputs?: Zigbee_Never_ScannedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Never_ScannedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No bindings configured." |
*
* @param {Zigbee_No_BindingsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_no_bindings: ((inputs?: Zigbee_No_BindingsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_No_BindingsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No endpoints reported." |
*
* @param {Zigbee_No_EndpointsInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_no_endpoints: ((inputs?: Zigbee_No_EndpointsInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_No_EndpointsInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "No reporting configured." |
*
* @param {Zigbee_No_ReportingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_no_reporting: ((inputs?: Zigbee_No_ReportingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_No_ReportingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Not in a Zigbee group." |
*
* @param {Zigbee_Not_In_GroupInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_not_in_group: ((inputs?: Zigbee_Not_In_GroupInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Not_In_GroupInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Optional" |
*
* @param {Zigbee_OptionalInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_optional: ((inputs?: Zigbee_OptionalInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_OptionalInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{state} · {progress}" |
*
* @param {Zigbee_Ota_ProgressInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_ota_progress: ((inputs: Zigbee_Ota_ProgressInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Ota_ProgressInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{state} · {version}" |
*
* @param {Zigbee_Ota_VersionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_ota_version: ((inputs: Zigbee_Ota_VersionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Ota_VersionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "{state} · {version} · {progress}" |
*
* @param {Zigbee_Ota_Version_ProgressInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_ota_version_progress: ((inputs: Zigbee_Ota_Version_ProgressInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Ota_Version_ProgressInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Output clusters" |
*
* @param {Zigbee_Output_ClustersInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_output_clusters: ((inputs?: Zigbee_Output_ClustersInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Output_ClustersInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "PAN ID" |
*
* @param {Zigbee_Pan_IdInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_pan_id: ((inputs?: Zigbee_Pan_IdInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Pan_IdInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Password" |
*
* @param {Zigbee_PasswordInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_password: ((inputs?: Zigbee_PasswordInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_PasswordInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Password set — leave blank to keep" |
*
* @param {Zigbee_Password_KeepInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_password_keep: ((inputs?: Zigbee_Password_KeepInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Password_KeepInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Power source" |
*
* @param {Zigbee_Power_SourceInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_power_source: ((inputs?: Zigbee_Power_SourceInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Power_SourceInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Profile ID" |
*
* @param {Zigbee_Profile_IdInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_profile_id: ((inputs?: Zigbee_Profile_IdInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Profile_IdInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Continuous rate must be between 1 and 10 commands per second." |
*
* @param {Zigbee_Rate_Continuous_InvalidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_rate_continuous_invalid: ((inputs?: Zigbee_Rate_Continuous_InvalidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Rate_Continuous_InvalidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Interactive rate must be between 1 and 50 commands per second." |
*
* @param {Zigbee_Rate_Interactive_InvalidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_rate_interactive_invalid: ((inputs?: Zigbee_Rate_Interactive_InvalidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Rate_Interactive_InvalidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Continuous rate cannot exceed the interactive rate." |
*
* @param {Zigbee_Rate_Order_InvalidInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_rate_order_invalid: ((inputs?: Zigbee_Rate_Order_InvalidInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Rate_Order_InvalidInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Connection and scan-schedule changes reconnect to the broker. Command-rate changes apply without interrupting device subscriptions." |
*
* @param {Zigbee_Reconnect_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_reconnect_help: ((inputs?: Zigbee_Reconnect_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Reconnect_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Reporting" |
*
* @param {Zigbee_ReportingInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_reporting: ((inputs?: Zigbee_ReportingInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_ReportingInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Runs daily at" |
*
* @param {Zigbee_Runs_Daily_AtInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_runs_daily_at: ((inputs?: Zigbee_Runs_Daily_AtInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Runs_Daily_AtInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Network scan complete" |
*
* @param {Zigbee_Scan_CompleteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_scan_complete: ((inputs?: Zigbee_Scan_CompleteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Scan_CompleteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scan hour" |
*
* @param {Zigbee_Scan_HourInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_scan_hour: ((inputs?: Zigbee_Scan_HourInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Scan_HourInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scan minute" |
*
* @param {Zigbee_Scan_MinuteInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_scan_minute: ((inputs?: Zigbee_Scan_MinuteInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Scan_MinuteInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scan network" |
*
* @param {Zigbee_Scan_NetworkInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_scan_network: ((inputs?: Zigbee_Scan_NetworkInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Scan_NetworkInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Could not start the network scan." |
*
* @param {Zigbee_Scan_Start_FailedInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_scan_start_failed: ((inputs?: Zigbee_Scan_Start_FailedInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Scan_Start_FailedInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scanning for {duration} — usually takes a few minutes" |
*
* @param {Zigbee_ScanningInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_scanning: ((inputs: Zigbee_ScanningInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_ScanningInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Scheduled scan" |
*
* @param {Zigbee_Scheduled_ScanInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_scheduled_scan: ((inputs?: Zigbee_Scheduled_ScanInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Scheduled_ScanInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Software build" |
*
* @param {Zigbee_Software_BuildInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_software_build: ((inputs?: Zigbee_Software_BuildInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Software_BuildInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Support" |
*
* @param {Zigbee_SupportInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_support: ((inputs?: Zigbee_SupportInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_SupportInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Target" |
*
* @param {Zigbee_TargetInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_target: ((inputs?: Zigbee_TargetInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_TargetInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Network topology" |
*
* @param {Zigbee_TopologyInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_topology: ((inputs?: Zigbee_TopologyInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_TopologyInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "About network topology" |
*
* @param {Zigbee_Topology_AboutInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_topology_about: ((inputs?: Zigbee_Topology_AboutInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Topology_AboutInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "A scan maps which devices relay for which, shown as the map's Connectivity view. It takes a few minutes and slows the Zigbee network while it runs." |
*
* @param {Zigbee_Topology_HelpInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_topology_help: ((inputs?: Zigbee_Topology_HelpInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Topology_HelpInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Unknown version" |
*
* @param {Zigbee_Unknown_VersionInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_unknown_version: ((inputs?: Zigbee_Unknown_VersionInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Unknown_VersionInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Use WebSocket Secure (WSS)" |
*
* @param {Zigbee_Use_WssInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_use_wss: ((inputs?: Zigbee_Use_WssInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_Use_WssInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Username" |
*
* @param {Zigbee_UsernameInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_username: ((inputs?: Zigbee_UsernameInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_UsernameInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
/**
* | output |
* | --- |
* | "Vendor" |
*
* @param {Zigbee_VendorInputs} inputs
* @param {{ locale?: "en" | "sv" | "ru" }} options
* @returns {LocalizedString}
*/
export const zigbee_vendor: ((inputs?: Zigbee_VendorInputs, options?: {
    locale?: "en" | "sv" | "ru";
}) => LocalizedString) & import("../runtime.js").MessageMetadata<Zigbee_VendorInputs, {
    locale?: "en" | "sv" | "ru";
}, {}>;
export type LocalizedString = import("../runtime.js").LocalizedString;
export type Activity_AdvancedInputs = {};
export type Activity_Automation_FiredInputs = {
    name: NonNullable<unknown>;
};
export type Activity_Automation_Fired_GenericInputs = {};
export type Activity_Automation_IdInputs = {
    id: NonNullable<unknown>;
};
export type Activity_Command_SentInputs = {
    name: NonNullable<unknown>;
};
export type Activity_Device_ActionInputs = {
    name: NonNullable<unknown>;
    action: NonNullable<unknown>;
};
export type Activity_Device_Action_GenericInputs = {
    name: NonNullable<unknown>;
};
export type Activity_Device_AddedInputs = {
    name: NonNullable<unknown>;
};
export type Activity_Device_Added_GenericInputs = {};
export type Activity_Device_OfflineInputs = {
    name: NonNullable<unknown>;
};
export type Activity_Device_OnlineInputs = {
    name: NonNullable<unknown>;
};
export type Activity_Device_RemovedInputs = {
    name: NonNullable<unknown>;
};
export type Activity_Device_Removed_GenericInputs = {};
export type Activity_Device_State_ChangedInputs = {
    name: NonNullable<unknown>;
};
export type Activity_EmptyInputs = {};
export type Activity_Empty_HelpInputs = {};
export type Activity_Event_Automation_FiredInputs = {};
export type Activity_Event_AvailabilityInputs = {};
export type Activity_Event_Command_SentInputs = {};
export type Activity_Event_Device_AddedInputs = {};
export type Activity_Event_Device_RemovedInputs = {};
export type Activity_Event_Node_ActivatedInputs = {};
export type Activity_Event_Scene_AppliedInputs = {};
export type Activity_Event_State_ChangedInputs = {};
export type Activity_Event_Webhook_ReceivedInputs = {};
export type Activity_Filter_DeviceInputs = {};
export type Activity_Filter_RoomInputs = {};
export type Activity_Filter_SinceInputs = {};
export type Activity_Filter_TypeInputs = {};
export type Activity_Generic_AutomationInputs = {};
export type Activity_Generic_DeviceInputs = {};
export type Activity_MessageInputs = {};
export type Activity_No_MatchInputs = {};
export type Activity_Node_ActivatedInputs = {
    name: NonNullable<unknown>;
};
export type Activity_Node_DeactivatedInputs = {
    name: NonNullable<unknown>;
};
export type Activity_PayloadInputs = {};
export type Activity_RecentInputs = {};
export type Activity_Recent_EmptyInputs = {};
export type Activity_Scene_AppliedInputs = {
    name: NonNullable<unknown>;
};
export type Activity_Scene_Applied_GenericInputs = {};
export type Activity_SearchInputs = {};
export type Activity_SelectInputs = {
    message: NonNullable<unknown>;
};
export type Activity_Since_DaysInputs = {
    count: NonNullable<unknown>;
};
export type Activity_Since_HourInputs = {};
export type Activity_Since_HoursInputs = {
    count: NonNullable<unknown>;
};
export type Activity_Since_MinutesInputs = {
    count: NonNullable<unknown>;
};
export type Activity_TimeInputs = {};
export type Activity_Type_ActionInputs = {};
export type Activity_Type_AddedInputs = {};
export type Activity_Type_AutomationInputs = {};
export type Activity_Type_AvailabilityInputs = {};
export type Activity_Type_CommandInputs = {};
export type Activity_Type_NodeInputs = {};
export type Activity_Type_RemovedInputs = {};
export type Activity_Type_SceneInputs = {};
export type Activity_Type_StateInputs = {};
export type Activity_Type_WebhookInputs = {};
export type Activity_UnknownInputs = {};
export type Activity_Webhook_ReceivedInputs = {
    name: NonNullable<unknown>;
};
export type Activity_Webhook_Received_GenericInputs = {};
export type Alarm_Battery_LowInputs = {
    name: NonNullable<unknown>;
    value: NonNullable<unknown>;
};
export type Alarm_Broker_DisconnectedInputs = {};
export type Alarm_Device_UnavailableInputs = {
    name: NonNullable<unknown>;
};
export type Alarm_Disk_LowInputs = {
    value: NonNullable<unknown>;
    threshold: NonNullable<unknown>;
};
export type Alarm_Memory_HighInputs = {
    value: NonNullable<unknown>;
    threshold: NonNullable<unknown>;
};
export type Alarm_Multiple_RaisedInputs = {};
export type Alarm_New_CountInputs = {
    count: NonNullable<unknown>;
};
export type Alarm_Toast_DescriptionInputs = {
    id: NonNullable<unknown>;
};
export type Alarm_Unknown_SystemInputs = {};
export type Alarms_Column_CountInputs = {};
export type Alarms_Column_Last_RaisedInputs = {};
export type Alarms_Column_MessageInputs = {};
export type Alarms_Delete_AriaInputs = {};
export type Alarms_Delete_Auto_DescriptionInputs = {};
export type Alarms_Delete_DescriptionInputs = {};
export type Alarms_Delete_Many_DescriptionInputs = {};
export type Alarms_Delete_Many_TitleInputs = {
    count: NonNullable<unknown>;
};
export type Alarms_Delete_TitleInputs = {};
export type Alarms_EmptyInputs = {};
export type Alarms_Empty_HelpInputs = {};
export type Alarms_Filter_KindInputs = {};
export type Alarms_Filter_SeverityInputs = {};
export type Alarms_Filter_SinceInputs = {};
export type Alarms_Filter_SourceInputs = {};
export type Alarms_Kind_AutoInputs = {};
export type Alarms_Kind_One_ShotInputs = {};
export type Alarms_No_MatchInputs = {};
export type Alarms_SearchInputs = {};
export type Alarms_SelectInputs = {
    id: NonNullable<unknown>;
};
export type Alarms_Severity_AriaInputs = {
    severity: NonNullable<unknown>;
};
export type Alarms_Severity_HighInputs = {};
export type Alarms_Severity_LowInputs = {};
export type Alarms_Severity_MediumInputs = {};
export type Alarms_TitleInputs = {};
export type Auth_Bootstrap_HelpInputs = {
    path: NonNullable<unknown>;
};
export type Auth_Bootstrap_TokenInputs = {};
export type Auth_Choose_PasswordInputs = {};
export type Auth_Confirm_New_PasswordInputs = {};
export type Auth_Confirm_PasswordInputs = {};
export type Auth_Create_UserInputs = {};
export type Auth_Create_User_FailedInputs = {};
export type Auth_Login_FailedInputs = {};
export type Auth_NameInputs = {};
export type Auth_New_PasswordInputs = {};
export type Auth_PasswordInputs = {};
export type Auth_Password_ComplexityInputs = {};
export type Auth_Password_MinimumInputs = {
    count: NonNullable<unknown>;
};
export type Auth_Password_SetInputs = {};
export type Auth_Passwords_MismatchInputs = {};
export type Auth_Set_A_New_PasswordInputs = {};
export type Auth_Set_New_PasswordInputs = {};
export type Auth_Set_PasswordInputs = {};
export type Auth_Set_Password_FailedInputs = {};
export type Auth_SetupInputs = {};
export type Auth_Setup_DescriptionInputs = {};
export type Auth_Setup_WelcomeInputs = {};
export type Auth_Sign_InInputs = {};
export type Auth_Sign_In_TitleInputs = {};
export type Auth_UsernameInputs = {};
export type Auth_Welcome_Choose_PasswordInputs = {
    name: NonNullable<unknown>;
};
export type Automation_Action_Activate_SceneInputs = {};
export type Automation_Action_Activate_Scene_DescriptionInputs = {};
export type Automation_Action_Change_ValueInputs = {};
export type Automation_Action_Change_Value_DescriptionInputs = {};
export type Automation_Action_Clear_AlarmInputs = {};
export type Automation_Action_Clear_Alarm_DescriptionInputs = {};
export type Automation_Action_Configure_DeviceInputs = {};
export type Automation_Action_Configure_Device_DescriptionInputs = {};
export type Automation_Action_Cycle_ScenesInputs = {};
export type Automation_Action_Cycle_Scenes_DescriptionInputs = {};
export type Automation_Action_Raise_AlarmInputs = {};
export type Automation_Action_Raise_Alarm_DescriptionInputs = {};
export type Automation_Action_Run_EffectInputs = {};
export type Automation_Action_Run_Effect_DescriptionInputs = {};
export type Automation_Action_Set_StateInputs = {};
export type Automation_Action_Set_State_DescriptionInputs = {};
export type Automation_Action_Toggle_StateInputs = {};
export type Automation_Action_Toggle_State_DescriptionInputs = {};
export type Automation_Change_DeltaInputs = {};
export type Automation_Change_No_FieldsInputs = {};
export type Automation_Change_RangeInputs = {
    minimum: NonNullable<unknown>;
    maximum: NonNullable<unknown>;
};
export type Automation_Change_Select_FieldInputs = {};
export type Automation_Change_ValueInputs = {};
export type Automation_Condition_CustomInputs = {};
export type Automation_Condition_Custom_DescriptionInputs = {};
export type Automation_Condition_Device_StateInputs = {};
export type Automation_Condition_Device_State_DescriptionInputs = {};
export type Automation_Condition_Time_WindowInputs = {};
export type Automation_Condition_Time_Window_DescriptionInputs = {};
export type Automation_Condition_WeekdayInputs = {};
export type Automation_Condition_Weekday_DescriptionInputs = {};
export type Automation_Editor_Add_NodeInputs = {};
export type Automation_Editor_AutoInputs = {};
export type Automation_Editor_Change_IconInputs = {};
export type Automation_Editor_CodeInputs = {};
export type Automation_Editor_Copy_NodesInputs = {};
export type Automation_Editor_Copy_Trigger_ConditionInputs = {};
export type Automation_Editor_Delete_DescriptionInputs = {
    name: NonNullable<unknown>;
};
export type Automation_Editor_Delete_FailedInputs = {};
export type Automation_Editor_Delete_TitleInputs = {};
export type Automation_Editor_EditInputs = {};
export type Automation_Editor_FallbackInputs = {};
export type Automation_Editor_Fire_FailedInputs = {};
export type Automation_Editor_FreeInputs = {};
export type Automation_Editor_Graph_AriaInputs = {};
export type Automation_Editor_Invalid_ConfigInputs = {};
export type Automation_Editor_LiveInputs = {};
export type Automation_Editor_LockInputs = {};
export type Automation_Editor_Name_PlaceholderInputs = {};
export type Automation_Editor_PasteInputs = {};
export type Automation_Editor_Paste_NodesInputs = {};
export type Automation_Editor_Save_FailedInputs = {};
export type Automation_Editor_SortInputs = {};
export type Automation_Editor_UnlockInputs = {};
export type Automation_Editor_VisualInputs = {};
export type Automation_Node_ActionInputs = {};
export type Automation_Node_Add_SceneInputs = {};
export type Automation_Node_AdvancedInputs = {};
export type Automation_Node_AfterInputs = {};
export type Automation_Node_After_HourInputs = {};
export type Automation_Node_After_MinuteInputs = {};
export type Automation_Node_Alarm_AutoInputs = {};
export type Automation_Node_Alarm_Id_Clear_PlaceholderInputs = {};
export type Automation_Node_Alarm_Id_PlaceholderInputs = {};
export type Automation_Node_Alarm_Message_PlaceholderInputs = {};
export type Automation_Node_Alarm_One_ShotInputs = {};
export type Automation_Node_BeforeInputs = {};
export type Automation_Node_Before_HourInputs = {};
export type Automation_Node_Before_MinuteInputs = {};
export type Automation_Node_ConditionInputs = {};
export type Automation_Node_Condition_ExpressionInputs = {};
export type Automation_Node_CooldownInputs = {};
export type Automation_Node_Cooldown_AboutInputs = {};
export type Automation_Node_Cooldown_HelpInputs = {};
export type Automation_Node_Cooldown_ShortInputs = {
    duration: NonNullable<unknown>;
};
export type Automation_Node_Cron_PlaceholderInputs = {};
export type Automation_Node_Custom_Expression_PlaceholderInputs = {};
export type Automation_Node_Deleted_SceneInputs = {
    id: NonNullable<unknown>;
};
export type Automation_Node_Event_AvailabilityInputs = {};
export type Automation_Node_Event_Device_AddedInputs = {};
export type Automation_Node_Event_Device_RemovedInputs = {};
export type Automation_Node_Event_State_ChangedInputs = {};
export type Automation_Node_Event_Value_PlaceholderInputs = {};
export type Automation_Node_Filter_TypeInputs = {};
export type Automation_Node_GraceInputs = {};
export type Automation_Node_Grace_AboutInputs = {};
export type Automation_Node_Grace_HelpInputs = {};
export type Automation_Node_Grace_ShortInputs = {
    duration: NonNullable<unknown>;
};
export type Automation_Node_HoursInputs = {};
export type Automation_Node_KindInputs = {};
export type Automation_Node_MinutesInputs = {};
export type Automation_Node_Missing_ScenesInputs = {};
export type Automation_Node_Move_DownInputs = {};
export type Automation_Node_Move_UpInputs = {};
export type Automation_Node_No_ScenesInputs = {};
export type Automation_Node_Pick_Device_ConfigureInputs = {};
export type Automation_Node_RemovedInputs = {};
export type Automation_Node_Schedule_AtInputs = {};
export type Automation_Node_Schedule_CustomInputs = {};
export type Automation_Node_Schedule_EveryInputs = {};
export type Automation_Node_Schedule_HourInputs = {};
export type Automation_Node_Schedule_IntervalInputs = {};
export type Automation_Node_Schedule_MinuteInputs = {};
export type Automation_Node_Schedule_SecondInputs = {};
export type Automation_Node_SecondsInputs = {};
export type Automation_Node_Select_ActionInputs = {};
export type Automation_Node_Select_ConditionInputs = {};
export type Automation_Node_Select_DeviceInputs = {};
export type Automation_Node_Select_EffectInputs = {};
export type Automation_Node_Select_EventInputs = {};
export type Automation_Node_Select_PropertyInputs = {};
export type Automation_Node_Select_SceneInputs = {};
export type Automation_Node_Select_TargetInputs = {};
export type Automation_Node_Select_TriggerInputs = {};
export type Automation_Node_Select_ValueInputs = {};
export type Automation_Node_Select_WebhookInputs = {};
export type Automation_Node_SeverityInputs = {};
export type Automation_Node_Severity_HighInputs = {};
export type Automation_Node_Severity_LowInputs = {};
export type Automation_Node_Severity_MediumInputs = {};
export type Automation_Node_SimpleInputs = {};
export type Automation_Node_TriggerInputs = {};
export type Automation_Node_Value_PlaceholderInputs = {};
export type Automation_Node_Webhook_DisabledInputs = {};
export type Automation_Node_Webhook_EnabledInputs = {};
export type Automation_Operator_AndInputs = {};
export type Automation_Operator_DelayInputs = {};
export type Automation_Operator_NotInputs = {};
export type Automation_Operator_OrInputs = {};
export type Automation_Operator_TitleInputs = {};
export type Automation_Schedule_At_DaysInputs = {
    time: NonNullable<unknown>;
    days: NonNullable<unknown>;
};
export type Automation_Schedule_Every_Day_AtInputs = {
    time: NonNullable<unknown>;
};
export type Automation_Schedule_Every_HoursInputs = {
    count: NonNullable<unknown>;
};
export type Automation_Schedule_Every_MinutesInputs = {
    count: NonNullable<unknown>;
};
export type Automation_Schedule_Every_SecondsInputs = {
    count: NonNullable<unknown>;
};
export type Automation_Schedule_Not_SetInputs = {};
export type Automation_State_Clear_BrightnessInputs = {};
export type Automation_State_Clear_ColorInputs = {};
export type Automation_State_Clear_Color_TemperatureInputs = {};
export type Automation_State_Clear_FanInputs = {};
export type Automation_State_Clear_ModeInputs = {};
export type Automation_State_Clear_PowerInputs = {};
export type Automation_State_Clear_SwingInputs = {};
export type Automation_State_Clear_Target_TemperatureInputs = {};
export type Automation_State_Clear_TransitionInputs = {};
export type Automation_State_Color_TemperatureInputs = {};
export type Automation_State_FanInputs = {};
export type Automation_State_ModeInputs = {};
export type Automation_State_No_CapabilitiesInputs = {};
export type Automation_State_PowerInputs = {};
export type Automation_State_Select_FanInputs = {};
export type Automation_State_Select_ModeInputs = {};
export type Automation_State_Select_SwingInputs = {};
export type Automation_State_SetInputs = {};
export type Automation_State_SwingInputs = {};
export type Automation_State_Target_TemperatureInputs = {};
export type Automation_State_TransitionInputs = {};
export type Automation_State_Transition_SecondsInputs = {};
export type Automation_Timing_ImmediateInputs = {};
export type Automation_Trigger_AvailabilityInputs = {};
export type Automation_Trigger_Availability_DescriptionInputs = {};
export type Automation_Trigger_CustomInputs = {};
export type Automation_Trigger_Custom_DescriptionInputs = {};
export type Automation_Trigger_Device_EventInputs = {};
export type Automation_Trigger_Device_Event_DescriptionInputs = {};
export type Automation_Trigger_Device_StateInputs = {};
export type Automation_Trigger_Device_State_DescriptionInputs = {};
export type Automation_Trigger_ScheduleInputs = {};
export type Automation_Trigger_Schedule_DescriptionInputs = {};
export type Automation_Trigger_WebhookInputs = {};
export type Automation_Trigger_Webhook_DescriptionInputs = {};
export type Automation_Validation_Action_RequiredInputs = {};
export type Automation_Validation_Alarm_Id_RequiredInputs = {};
export type Automation_Validation_Change_Mode_InvalidInputs = {};
export type Automation_Validation_Condition_RequiredInputs = {};
export type Automation_Validation_Cron_RequiredInputs = {};
export type Automation_Validation_Delta_Non_ZeroInputs = {};
export type Automation_Validation_Device_RequiredInputs = {};
export type Automation_Validation_Effect_RequiredInputs = {};
export type Automation_Validation_Event_RequiredInputs = {};
export type Automation_Validation_Expression_RequiredInputs = {};
export type Automation_Validation_Field_RequiredInputs = {};
export type Automation_Validation_Filter_Number_Operator_TypeInputs = {};
export type Automation_Validation_Filter_Path_RequiredInputs = {};
export type Automation_Validation_Filter_Text_Operator_TypeInputs = {};
export type Automation_Validation_Filter_Value_RequiredInputs = {};
export type Automation_Validation_Filter_Value_Type_RequiredInputs = {};
export type Automation_Validation_Interval_PositiveInputs = {};
export type Automation_Validation_Json_InvalidInputs = {};
export type Automation_Validation_Property_RequiredInputs = {};
export type Automation_Validation_Rules_RequiredInputs = {};
export type Automation_Validation_Scene_Reference_InvalidInputs = {};
export type Automation_Validation_Scenes_MinimumInputs = {};
export type Automation_Validation_Setting_InvalidInputs = {};
export type Automation_Validation_Setting_Value_InvalidInputs = {};
export type Automation_Validation_Settings_RequiredInputs = {};
export type Automation_Validation_Target_RequiredInputs = {};
export type Automation_Validation_Trigger_RequiredInputs = {};
export type Automation_Validation_Value_RequiredInputs = {};
export type Automation_Validation_Webhook_RequiredInputs = {};
export type Automation_Webhook_Add_FilterInputs = {};
export type Automation_Webhook_Filter_Path_AriaInputs = {};
export type Automation_Webhook_Filter_Value_AriaInputs = {};
export type Automation_Webhook_FiltersInputs = {};
export type Automation_Webhook_OperatorInputs = {};
export type Automation_Webhook_Operator_At_LeastInputs = {};
export type Automation_Webhook_Operator_At_MostInputs = {};
export type Automation_Webhook_Operator_ContainsInputs = {};
export type Automation_Webhook_Operator_Ends_WithInputs = {};
export type Automation_Webhook_Operator_EqualsInputs = {};
export type Automation_Webhook_Operator_ExistsInputs = {};
export type Automation_Webhook_Operator_Greater_ThanInputs = {};
export type Automation_Webhook_Operator_Less_ThanInputs = {};
export type Automation_Webhook_Operator_Not_EqualsInputs = {};
export type Automation_Webhook_Operator_Not_ExistsInputs = {};
export type Automation_Webhook_Operator_Starts_WithInputs = {};
export type Automation_Webhook_PathInputs = {};
export type Automation_Webhook_Remove_FilterInputs = {};
export type Automation_Webhook_Source_BodyInputs = {};
export type Automation_Webhook_Source_HeaderInputs = {};
export type Automation_Webhook_Source_QueryInputs = {};
export type Automation_Webhook_Type_BooleanInputs = {};
export type Automation_Webhook_Type_NullInputs = {};
export type Automation_Webhook_Type_NumberInputs = {};
export type Automation_Webhook_Type_TextInputs = {};
export type Automation_Webhook_ValueInputs = {};
export type Automations_Action_CountInputs = {
    count: NonNullable<unknown>;
};
export type Automations_Column_CompositionInputs = {};
export type Automations_Column_Created_ByInputs = {};
export type Automations_Column_Last_TriggeredInputs = {};
export type Automations_Column_MetaInputs = {};
export type Automations_Column_NameInputs = {};
export type Automations_CreateInputs = {};
export type Automations_Create_DescriptionInputs = {};
export type Automations_Create_FirstInputs = {};
export type Automations_Create_MoreInputs = {};
export type Automations_Create_ShortInputs = {};
export type Automations_CreatingInputs = {};
export type Automations_Delete_DescriptionInputs = {
    name: NonNullable<unknown>;
};
export type Automations_Delete_Many_DescriptionInputs = {};
export type Automations_Delete_Many_TitleInputs = {
    count: NonNullable<unknown>;
};
export type Automations_Delete_TitleInputs = {};
export type Automations_DisableInputs = {
    name: NonNullable<unknown>;
};
export type Automations_EditInputs = {};
export type Automations_EmptyInputs = {};
export type Automations_Empty_HelpInputs = {};
export type Automations_EnableInputs = {
    name: NonNullable<unknown>;
};
export type Automations_Error_CreateInputs = {};
export type Automations_Error_DeleteInputs = {};
export type Automations_Error_Delete_ManyInputs = {};
export type Automations_Error_IconInputs = {};
export type Automations_Error_RenameInputs = {};
export type Automations_Error_ToggleInputs = {};
export type Automations_Filter_ActionInputs = {};
export type Automations_Filter_DeviceInputs = {};
export type Automations_Filter_EmptyInputs = {};
export type Automations_Filter_EnabledInputs = {};
export type Automations_Filter_SceneInputs = {};
export type Automations_Filter_TriggerInputs = {};
export type Automations_FiredInputs = {
    time: NonNullable<unknown>;
};
export type Automations_Name_PlaceholderInputs = {};
export type Automations_No_MatchInputs = {};
export type Automations_Node_CountInputs = {
    count: NonNullable<unknown>;
};
export type Automations_Operator_CountInputs = {
    count: NonNullable<unknown>;
};
export type Automations_SearchInputs = {};
export type Automations_SelectInputs = {
    name: NonNullable<unknown>;
};
export type Automations_TitleInputs = {};
export type Automations_Trigger_CountInputs = {
    count: NonNullable<unknown>;
};
export type Automations_Trigger_EventInputs = {};
export type Automations_Trigger_ScheduleInputs = {};
export type Button_Action_AtInputs = {
    time: NonNullable<unknown>;
};
export type Button_Last_ActionInputs = {};
export type Button_Last_SeenInputs = {
    time: NonNullable<unknown>;
};
export type Button_No_ActionInputs = {};
export type Button_StatusInputs = {};
export type Color_Picker_AriaInputs = {};
export type Common_Add_ToInputs = {};
export type Common_Brand_NameInputs = {};
export type Common_CancelInputs = {};
export type Common_ClearInputs = {};
export type Common_CloseInputs = {};
export type Common_CompleteInputs = {};
export type Common_ConfirmInputs = {};
export type Common_ContinueInputs = {};
export type Common_CopiedInputs = {};
export type Common_CopyInputs = {};
export type Common_Copy_IdInputs = {};
export type Common_DeleteInputs = {};
export type Common_DisableInputs = {};
export type Common_DismissInputs = {};
export type Common_EditInputs = {};
export type Common_EnableInputs = {};
export type Common_Error_GenericInputs = {};
export type Common_Error_Load_DataInputs = {};
export type Common_Error_Server_UnreachableInputs = {};
export type Common_Error_Try_AgainInputs = {};
export type Common_In_ProgressInputs = {};
export type Common_LoadingInputs = {};
export type Common_NoInputs = {};
export type Common_NoneInputs = {};
export type Common_RemoveInputs = {};
export type Common_SaveInputs = {};
export type Common_SavingInputs = {};
export type Common_SearchInputs = {};
export type Common_Search_ClearInputs = {};
export type Common_SelectInputs = {};
export type Common_SuccessfulInputs = {};
export type Common_SupportedInputs = {};
export type Common_Time_Hour_PlaceholderInputs = {};
export type Common_Time_Minute_PlaceholderInputs = {};
export type Common_Time_Second_PlaceholderInputs = {};
export type Common_Try_AgainInputs = {};
export type Common_Unknown_ValueInputs = {
    value: NonNullable<unknown>;
};
export type Common_UnsupportedInputs = {};
export type Common_UploadingInputs = {};
export type Common_YesInputs = {};
export type Connection_Authentication_FailedInputs = {};
export type Connection_ConnectedInputs = {};
export type Connection_FailedInputs = {};
export type Connection_TimeoutInputs = {};
export type Connection_Tls_FailedInputs = {};
export type Connection_UnavailableInputs = {};
export type Connection_UnconfiguredInputs = {};
export type Connection_UnreachableInputs = {};
export type Contact_NameInputs = {
    role: NonNullable<unknown>;
};
export type Contact_Summary_MultipleInputs = {
    role: NonNullable<unknown>;
    open: NonNullable<unknown>;
    unknown: NonNullable<unknown>;
};
export type Contact_Summary_SingleInputs = {
    role: NonNullable<unknown>;
    state: NonNullable<unknown>;
};
export type Dashboard_ApartmentInputs = {};
export type Dashboard_No_IntegrationsInputs = {};
export type Dashboard_No_Integrations_HelpInputs = {};
export type Dashboard_No_RoomsInputs = {};
export type Dashboard_No_Rooms_HelpInputs = {};
export type Dashboard_RoomsInputs = {};
export type Dashboard_Setup_IntegrationInputs = {};
export type Data_Viewer_AddInputs = {};
export type Data_Viewer_Add_SourceInputs = {};
export type Data_Viewer_Add_Source_DescriptionInputs = {};
export type Data_Viewer_ApartmentInputs = {};
export type Data_Viewer_Apartment_AllInputs = {};
export type Data_Viewer_Devices_ButtonsInputs = {};
export type Data_Viewer_Devices_LightsInputs = {};
export type Data_Viewer_Devices_OtherInputs = {};
export type Data_Viewer_Devices_PlugsInputs = {};
export type Data_Viewer_Devices_SensorsInputs = {};
export type Data_Viewer_Devices_SpeakersInputs = {};
export type Data_Viewer_EmptyInputs = {};
export type Data_Viewer_GroupsInputs = {};
export type Data_Viewer_No_SamplesInputs = {};
export type Data_Viewer_Remove_SourceInputs = {
    name: NonNullable<unknown>;
};
export type Data_Viewer_RoomsInputs = {};
export type Data_Viewer_SourcesInputs = {};
export type Data_Viewer_TitleInputs = {};
export type Device_Adjust_Climate_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Device_Adjust_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Device_ApplyInputs = {};
export type Device_ApplyingInputs = {};
export type Device_Back_To_DevicesInputs = {};
export type Device_BrightnessInputs = {};
export type Device_ColorInputs = {};
export type Device_Config_AboutInputs = {
    name: NonNullable<unknown>;
};
export type Device_Config_Add_OneInputs = {};
export type Device_Config_Add_SettingInputs = {};
export type Device_Config_RemoveInputs = {
    name: NonNullable<unknown>;
};
export type Device_Configuration_FailedInputs = {};
export type Device_Configuration_TimeoutInputs = {};
export type Device_Controls_DisabledInputs = {};
export type Device_Controls_Enable_HelpInputs = {};
export type Device_Copy_IdInputs = {};
export type Device_FanInputs = {};
export type Device_GenericInputs = {};
export type Device_HistoryInputs = {};
export type Device_IdInputs = {};
export type Device_Image_AltInputs = {
    name: NonNullable<unknown>;
};
export type Device_InfoInputs = {};
export type Device_Memberships_EmptyInputs = {};
export type Device_ModeInputs = {};
export type Device_NameInputs = {};
export type Device_No_StateInputs = {};
export type Device_Not_FoundInputs = {};
export type Device_Not_Found_HelpInputs = {};
export type Device_PowerInputs = {};
export type Device_RolesInputs = {};
export type Device_Roles_ApplianceInputs = {};
export type Device_Roles_ContactInputs = {};
export type Device_Roles_ControlsInputs = {};
export type Device_Roles_General_ContactInputs = {};
export type Device_Roles_Used_In_MapInputs = {};
export type Device_Save_FailedInputs = {};
export type Device_Select_FanInputs = {};
export type Device_Select_ModeInputs = {};
export type Device_Select_SpeedInputs = {};
export type Device_Select_SwingInputs = {};
export type Device_SettingsInputs = {};
export type Device_SwingInputs = {};
export type Device_TargetInputs = {};
export type Device_Target_TemperatureInputs = {};
export type Device_Temperature_LowerInputs = {};
export type Device_Temperature_RaiseInputs = {};
export type Device_Toggle_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Device_Type_ButtonInputs = {};
export type Device_Type_ClimateInputs = {};
export type Device_Type_HubInputs = {};
export type Device_Type_LightInputs = {};
export type Device_Type_PlugInputs = {};
export type Device_Type_SensorInputs = {};
export type Device_Type_SpeakerInputs = {};
export type Device_Type_SwitchInputs = {};
export type Device_Type_UnknownInputs = {};
export type Device_UpdateInputs = {};
export type Device_WaitingInputs = {};
export type Device_WhiteInputs = {};
export type Devices_ActionsInputs = {};
export type Devices_Add_To_ActionInputs = {};
export type Devices_Add_To_DescriptionInputs = {};
export type Devices_Add_To_GenericInputs = {};
export type Devices_Add_To_TitleInputs = {
    name: NonNullable<unknown>;
};
export type Devices_Brightness_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Devices_Delete_FailedInputs = {};
export type Devices_Delete_Many_DescriptionInputs = {
    count: NonNullable<unknown>;
};
export type Devices_Delete_Many_TitleInputs = {};
export type Devices_Delete_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Devices_Delete_One_DescriptionInputs = {
    name: NonNullable<unknown>;
};
export type Devices_Delete_One_TitleInputs = {};
export type Devices_DisableInputs = {};
export type Devices_EditInputs = {};
export type Devices_EnableInputs = {};
export type Devices_NewInputs = {};
export type Devices_No_MatchInputs = {};
export type Devices_NoneInputs = {};
export type Devices_None_HelpInputs = {};
export type Devices_OfflineInputs = {};
export type Devices_OnlineInputs = {};
export type Devices_RestoreInputs = {};
export type Devices_Restore_FailedInputs = {};
export type Devices_Restore_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Devices_SearchInputs = {};
export type Devices_Trigger_EventInputs = {
    name: NonNullable<unknown>;
};
export type Effect_Action_RunInputs = {};
export type Effect_BackInputs = {};
export type Effect_Cap_BrightnessInputs = {};
export type Effect_Cap_ColorInputs = {};
export type Effect_Cap_Color_TempInputs = {};
export type Effect_Cap_On_OffInputs = {};
export type Effect_Change_IconInputs = {};
export type Effect_DeletedInputs = {};
export type Effect_FallbackInputs = {};
export type Effect_Load_FailedInputs = {};
export type Effect_Name_LabelInputs = {};
export type Effect_Native_Read_OnlyInputs = {};
export type Effect_Not_FoundInputs = {};
export type Effect_Not_Found_HelpInputs = {};
export type Effect_Running_SavedInputs = {};
export type Effect_Save_FailedInputs = {};
export type Effect_Timeline_Add_Clip_ToInputs = {
    name: NonNullable<unknown>;
};
export type Effect_Timeline_Add_TrackInputs = {};
export type Effect_Timeline_Add_Track_FirstInputs = {};
export type Effect_Timeline_AriaInputs = {};
export type Effect_Timeline_Brightness_SummaryInputs = {
    value: NonNullable<unknown>;
};
export type Effect_Timeline_Brightness_ValueInputs = {
    value: NonNullable<unknown>;
};
export type Effect_Timeline_Clip_CountInputs = {
    count: NonNullable<unknown>;
};
export type Effect_Timeline_Copy_ClipInputs = {};
export type Effect_Timeline_Drag_Loop_EndInputs = {};
export type Effect_Timeline_DurationInputs = {
    duration: NonNullable<unknown>;
};
export type Effect_Timeline_Edit_ClipInputs = {};
export type Effect_Timeline_EmptyInputs = {};
export type Effect_Timeline_End_GapInputs = {
    end: NonNullable<unknown>;
    gap: NonNullable<unknown>;
};
export type Effect_Timeline_FitInputs = {};
export type Effect_Timeline_Loop_EffectInputs = {};
export type Effect_Timeline_MiredsInputs = {
    value: NonNullable<unknown>;
};
export type Effect_Timeline_NativeInputs = {};
export type Effect_Timeline_Native_FallbackInputs = {};
export type Effect_Timeline_No_NativeInputs = {};
export type Effect_Timeline_No_Space_NewInputs = {};
export type Effect_Timeline_No_Space_PasteInputs = {};
export type Effect_Timeline_On_OffInputs = {};
export type Effect_Timeline_Paste_ClipInputs = {};
export type Effect_Timeline_Random_TransitionInputs = {};
export type Effect_Timeline_Remove_ClipInputs = {};
export type Effect_Timeline_Remove_TrackInputs = {};
export type Effect_Timeline_RequiredInputs = {};
export type Effect_Timeline_Resize_ClipInputs = {};
export type Effect_Timeline_Start_MsInputs = {};
export type Effect_Timeline_Start_Ms_AriaInputs = {};
export type Effect_Timeline_StateInputs = {};
export type Effect_Timeline_TitleInputs = {};
export type Effect_Timeline_TrackInputs = {
    number: NonNullable<unknown>;
};
export type Effect_Timeline_Track_CountInputs = {
    count: NonNullable<unknown>;
};
export type Effect_Timeline_TracksInputs = {};
export type Effect_Timeline_TransitionInputs = {};
export type Effect_Timeline_Transition_AriaInputs = {};
export type Effect_Timeline_Transition_MaxInputs = {};
export type Effect_Timeline_Transition_Max_AriaInputs = {};
export type Effect_Timeline_Transition_MinInputs = {};
export type Effect_Timeline_Transition_Min_AriaInputs = {};
export type Effect_Timeline_Zoom_InInputs = {};
export type Effect_Timeline_Zoom_OutInputs = {};
export type Effect_Validation_Clip_Start_NegativeInputs = {};
export type Effect_Validation_Config_InvalidInputs = {};
export type Effect_Validation_Duration_NegativeInputs = {};
export type Effect_Validation_Name_RequiredInputs = {};
export type Effect_Validation_Native_RequiredInputs = {};
export type Effect_Validation_OverlapInputs = {};
export type Effect_Validation_Past_LoopInputs = {};
export type Effect_Validation_Transition_InvalidInputs = {};
export type Effects_Column_Created_ByInputs = {};
export type Effects_Column_DetailsInputs = {};
export type Effects_Column_NameInputs = {};
export type Effects_Column_RequiredInputs = {};
export type Effects_Column_SourceInputs = {};
export type Effects_CreateInputs = {};
export type Effects_Create_DescriptionInputs = {};
export type Effects_Create_FirstInputs = {};
export type Effects_Create_MoreInputs = {};
export type Effects_Create_ShortInputs = {};
export type Effects_CreatingInputs = {};
export type Effects_Delete_DescriptionInputs = {
    name: NonNullable<unknown>;
};
export type Effects_Delete_Many_DescriptionInputs = {};
export type Effects_Delete_Many_TitleInputs = {
    count: NonNullable<unknown>;
};
export type Effects_Delete_TitleInputs = {};
export type Effects_EditInputs = {};
export type Effects_EmptyInputs = {};
export type Effects_Empty_HelpInputs = {};
export type Effects_Error_CreateInputs = {};
export type Effects_Error_DeleteInputs = {};
export type Effects_Error_Delete_ManyInputs = {};
export type Effects_Error_IconInputs = {};
export type Effects_Error_RenameInputs = {};
export type Effects_Hive_GroupInputs = {};
export type Effects_KindInputs = {};
export type Effects_LoopInputs = {};
export type Effects_Managed_ZigbeeInputs = {};
export type Effects_Name_PlaceholderInputs = {};
export type Effects_Native_EmptyInputs = {};
export type Effects_Native_Load_ErrorInputs = {};
export type Effects_Native_LoadingInputs = {};
export type Effects_No_ConfirmationInputs = {};
export type Effects_No_MatchInputs = {};
export type Effects_No_Required_CapabilitiesInputs = {};
export type Effects_OnceInputs = {};
export type Effects_Picker_DescriptionInputs = {};
export type Effects_Picker_TitleInputs = {};
export type Effects_RunInputs = {};
export type Effects_Run_DescriptionInputs = {};
export type Effects_Run_ZigbeeInputs = {};
export type Effects_SearchInputs = {};
export type Effects_SelectInputs = {
    name: NonNullable<unknown>;
};
export type Effects_Select_EffectInputs = {};
export type Effects_SourceInputs = {};
export type Effects_Start_FailedInputs = {};
export type Effects_StartedInputs = {};
export type Effects_Started_DevicesInputs = {
    count: NonNullable<unknown>;
};
export type Effects_Started_PartialInputs = {
    confirmed: NonNullable<unknown>;
    total: NonNullable<unknown>;
};
export type Effects_SummaryInputs = {
    mode: NonNullable<unknown>;
    tracks: NonNullable<unknown>;
    clips: NonNullable<unknown>;
};
export type Effects_Support_ConfirmedInputs = {};
export type Effects_Support_UnsupportedInputs = {};
export type Effects_Support_UntestedInputs = {};
export type Effects_Supported_CountInputs = {
    count: NonNullable<unknown>;
};
export type Effects_Target_UnsupportedInputs = {};
export type Effects_TimelineInputs = {};
export type Effects_TitleInputs = {};
export type Effects_Unconfirmed_CountInputs = {
    count: NonNullable<unknown>;
};
export type Effects_Unsupported_CountInputs = {
    count: NonNullable<unknown>;
};
export type Effects_Zigbee_EffectInputs = {};
export type Effects_Zigbee_GroupInputs = {};
export type Entity_ActionsInputs = {
    name: NonNullable<unknown>;
};
export type Entity_Tag_RoomsInputs = {};
export type Error_Authentication_FailedInputs = {};
export type Error_Bad_RequestInputs = {};
export type Error_ConflictInputs = {};
export type Error_Go_BackInputs = {};
export type Error_Invalid_Bootstrap_TokenInputs = {};
export type Error_Not_FoundInputs = {};
export type Error_Not_Found_DetailInputs = {};
export type Error_Not_Found_TitleInputs = {};
export type Error_Page_DetailInputs = {};
export type Error_Page_TitleInputs = {};
export type Error_Password_Change_RequiredInputs = {};
export type Error_Rate_LimitedInputs = {
    seconds: NonNullable<unknown>;
};
export type Error_UnauthenticatedInputs = {};
export type Error_ValidationInputs = {};
export type Field_ActionInputs = {};
export type Field_AvailabilityInputs = {};
export type Field_BatteryInputs = {};
export type Field_BreakdownInputs = {};
export type Field_BrightnessInputs = {};
export type Field_ColorInputs = {};
export type Field_Color_TemperatureInputs = {};
export type Field_ContactInputs = {};
export type Field_Created_ByInputs = {};
export type Field_CurrentInputs = {};
export type Field_DeletedInputs = {};
export type Field_DeviceInputs = {};
export type Field_Device_PostureInputs = {};
export type Field_DisabledInputs = {};
export type Field_EffectInputs = {};
export type Field_EmptyInputs = {};
export type Field_EnabledInputs = {};
export type Field_EnergyInputs = {};
export type Field_Fan_ModeInputs = {};
export type Field_HumidityInputs = {};
export type Field_Hvac_ModeInputs = {};
export type Field_IlluminanceInputs = {};
export type Field_Last_SeenInputs = {};
export type Field_Link_QualityInputs = {};
export type Field_Managed_ByInputs = {};
export type Field_MembersInputs = {};
export type Field_NameInputs = {};
export type Field_NewInputs = {};
export type Field_OccupancyInputs = {};
export type Field_OnInputs = {};
export type Field_OrientationInputs = {};
export type Field_PowerInputs = {};
export type Field_Power_On_BehaviorInputs = {};
export type Field_PressureInputs = {};
export type Field_Rooms_GroupsInputs = {};
export type Field_SourceInputs = {};
export type Field_StateInputs = {};
export type Field_SwingInputs = {};
export type Field_Target_TemperatureInputs = {};
export type Field_TemperatureInputs = {};
export type Field_TransitionInputs = {};
export type Field_TypeInputs = {};
export type Field_VoltageInputs = {};
export type Group_AddInputs = {};
export type Group_Add_DescriptionInputs = {};
export type Group_Add_GenericInputs = {};
export type Group_Add_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Group_Add_Search_DescriptionInputs = {};
export type Group_CreateInputs = {};
export type Group_Create_DescriptionInputs = {};
export type Group_Create_FailedInputs = {};
export type Group_Create_FirstInputs = {};
export type Group_Create_MoreInputs = {};
export type Group_CreatingInputs = {};
export type Group_DeleteInputs = {};
export type Group_Delete_DescriptionInputs = {};
export type Group_Delete_FailedInputs = {};
export type Group_Delete_Many_DescriptionInputs = {};
export type Group_Delete_Many_FailedInputs = {};
export type Group_Delete_Many_TitleInputs = {
    count: NonNullable<unknown>;
};
export type Group_Delete_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Group_EditInputs = {};
export type Group_GenericInputs = {};
export type Group_Managed_ZigbeeInputs = {};
export type Group_Member_AddInputs = {};
export type Group_Members_EmptyInputs = {};
export type Group_Members_NoneInputs = {};
export type Group_NameInputs = {};
export type Group_No_MatchInputs = {};
export type Group_NoneInputs = {};
export type Group_None_HelpInputs = {};
export type Group_Rename_FailedInputs = {};
export type Group_Save_FailedInputs = {};
export type Group_SearchInputs = {};
export type Group_TagsInputs = {};
export type Group_Tags_AboutInputs = {};
export type Group_Tags_HelpInputs = {};
export type Guest_Login_FailedInputs = {};
export type Guest_LogoutInputs = {};
export type Guest_Mode_GuestInputs = {};
export type Guest_Mode_UserInputs = {};
export type Guest_NameInputs = {};
export type Guest_Sign_In_TitleInputs = {};
export type Guest_UnavailableInputs = {};
export type Guests_AddInputs = {};
export type Guests_Add_ShortInputs = {};
export type Guests_Create_DescriptionInputs = {};
export type Guests_Create_FailedInputs = {};
export type Guests_CreatedInputs = {
    name: NonNullable<unknown>;
};
export type Guests_CustomInputs = {};
export type Guests_Custom_DurationInputs = {};
export type Guests_DaysInputs = {};
export type Guests_Delete_DescriptionInputs = {
    name: NonNullable<unknown>;
};
export type Guests_Delete_FailedInputs = {};
export type Guests_Delete_TitleInputs = {};
export type Guests_DeletedInputs = {
    name: NonNullable<unknown>;
};
export type Guests_DurationInputs = {};
export type Guests_ExpiresInputs = {
    time: NonNullable<unknown>;
};
export type Guests_ExtendInputs = {};
export type Guests_Extend_DescriptionInputs = {
    name: NonNullable<unknown>;
};
export type Guests_Extend_FailedInputs = {};
export type Guests_Extend_MaximumInputs = {};
export type Guests_ExtendedInputs = {
    name: NonNullable<unknown>;
};
export type Guests_Four_HoursInputs = {};
export type Guests_HoursInputs = {};
export type Guests_One_DayInputs = {};
export type Guests_One_HourInputs = {};
export type Guests_TypeInputs = {};
export type History_All_HiddenInputs = {};
export type History_Dismiss_ReadingInputs = {};
export type History_EndInputs = {};
export type History_Last_HoursInputs = {
    count: NonNullable<unknown>;
};
export type History_Load_FailedInputs = {};
export type History_Loading_MoreInputs = {};
export type History_No_SamplesInputs = {};
export type History_ResolutionInputs = {};
export type History_Resolution_AutoInputs = {};
export type History_Resolution_DaysInputs = {
    count: NonNullable<unknown>;
};
export type History_Resolution_HoursInputs = {
    count: NonNullable<unknown>;
};
export type History_Resolution_MinutesInputs = {
    count: NonNullable<unknown>;
};
export type History_Unknown_Before_FirstInputs = {};
export type History_View_MoreInputs = {};
export type Icon_ChangeInputs = {};
export type Icon_Change_FailedInputs = {};
export type Icon_ClearInputs = {};
export type Icon_NoneInputs = {};
export type Icon_SearchInputs = {};
export type Icon_Search_PromptInputs = {};
export type Integrations_AddInputs = {};
export type Integrations_Add_DescriptionInputs = {};
export type Integrations_Add_ShortInputs = {};
export type Integrations_ConfigureInputs = {};
export type Integrations_DeleteInputs = {};
export type Integrations_Delete_Keep_DescriptionInputs = {};
export type Integrations_Delete_Purge_DescriptionInputs = {};
export type Integrations_Delete_TitleInputs = {};
export type Integrations_Description_GenericInputs = {};
export type Integrations_Description_TuyaInputs = {};
export type Integrations_Description_Zigbee2mqttInputs = {};
export type Integrations_Devices_DeletedInputs = {
    count: NonNullable<unknown>;
};
export type Integrations_Devices_KeptInputs = {
    count: NonNullable<unknown>;
};
export type Integrations_EmptyInputs = {};
export type Integrations_Empty_HelpInputs = {};
export type Integrations_No_MatchInputs = {};
export type Integrations_None_AvailableInputs = {};
export type Integrations_SearchInputs = {};
export type Integrations_Status_ConfiguredInputs = {};
export type Integrations_Status_ConnectedInputs = {};
export type Integrations_Status_DisabledInputs = {};
export type Language_EnglishInputs = {};
export type Language_RussianInputs = {};
export type Language_SwedishInputs = {};
export type Lights_On_CountInputs = {
    on: NonNullable<unknown>;
    total: NonNullable<unknown>;
};
export type Logs_LiveInputs = {};
export type Logs_PausedInputs = {};
export type Logs_SearchInputs = {};
export type Maintenance_Battery_ActionInputs = {};
export type Maintenance_Battery_DetailInputs = {
    name: NonNullable<unknown>;
    value: NonNullable<unknown>;
};
export type Maintenance_Correct_PostureInputs = {};
export type Maintenance_EmptyInputs = {};
export type Maintenance_Filter_DeviceInputs = {};
export type Maintenance_Filter_Device_TypeInputs = {};
export type Maintenance_Filter_KindInputs = {};
export type Maintenance_Filter_StatusInputs = {};
export type Maintenance_Firmware_ActionInputs = {};
export type Maintenance_Firmware_DetailInputs = {
    version: NonNullable<unknown>;
    name: NonNullable<unknown>;
};
export type Maintenance_Free_StorageInputs = {};
export type Maintenance_Group_BatteriesInputs = {};
export type Maintenance_Group_PostureInputs = {};
export type Maintenance_Group_SystemInputs = {};
export type Maintenance_Group_UpdatesInputs = {};
export type Maintenance_LoadingInputs = {};
export type Maintenance_Mark_All_DoneInputs = {};
export type Maintenance_Mark_DoneInputs = {};
export type Maintenance_No_MatchInputs = {};
export type Maintenance_OpenInputs = {};
export type Maintenance_Posture_ActionInputs = {};
export type Maintenance_Posture_DetailInputs = {
    name: NonNullable<unknown>;
};
export type Maintenance_Replace_BatteryInputs = {};
export type Maintenance_SearchInputs = {};
export type Maintenance_Status_DisabledInputs = {};
export type Maintenance_Status_OfflineInputs = {};
export type Maintenance_Status_OnlineInputs = {};
export type Maintenance_Status_SystemInputs = {};
export type Maintenance_Storage_DetailInputs = {
    path: NonNullable<unknown>;
    value: NonNullable<unknown>;
};
export type Maintenance_Type_ColorInputs = {};
export type Maintenance_Type_FirmwareInputs = {};
export type Maintenance_Type_PostureInputs = {};
export type Maintenance_Type_StorageInputs = {};
export type Maintenance_Upgrade_FirmwareInputs = {};
export type Maintenance_View_DeviceInputs = {};
export type Map_Add_SelectionInputs = {};
export type Map_Add_Selection_HintInputs = {};
export type Map_Add_Selection_StopInputs = {};
export type Map_AttachedInputs = {};
export type Map_Blocks_LightInputs = {};
export type Map_Brush_CustomInputs = {};
export type Map_Brush_LargerInputs = {};
export type Map_Brush_NoneInputs = {};
export type Map_Brush_PaintsInputs = {
    value: NonNullable<unknown>;
};
export type Map_Brush_SmallerInputs = {};
export type Map_Brush_Turns_OffInputs = {};
export type Map_Brush_Turns_OnInputs = {};
export type Map_Clear_Measurements_As_You_GoInputs = {};
export type Map_Conflict_ConfirmInputs = {};
export type Map_Conflict_DescriptionInputs = {
    name: NonNullable<unknown>;
};
export type Map_Conflict_MarkersInputs = {};
export type Map_Conflict_TitleInputs = {};
export type Map_Copy_Selected_WallsInputs = {};
export type Map_Default_NameInputs = {};
export type Map_Delete_RoomInputs = {};
export type Map_Detach_SensorInputs = {};
export type Map_Detach_Sensor_FirstInputs = {};
export type Map_Detached_RoomsInputs = {};
export type Map_Device_CountInputs = {
    count: NonNullable<unknown>;
};
export type Map_Devices_PlacedInputs = {
    placed: NonNullable<unknown>;
    total: NonNullable<unknown>;
};
export type Map_DiscardInputs = {};
export type Map_Discard_DescriptionInputs = {};
export type Map_Discard_Detached_RoomInputs = {};
export type Map_Discard_TitleInputs = {};
export type Map_Door_Sensor_ConflictInputs = {};
export type Map_Drag_Device_GroupInputs = {};
export type Map_DuplicateInputs = {};
export type Map_Editor_LabelInputs = {};
export type Map_EmptyInputs = {};
export type Map_Empty_HelpInputs = {};
export type Map_Error_Apply_SceneInputs = {};
export type Map_Error_Display_ColorInputs = {};
export type Map_Error_SaveInputs = {};
export type Map_Error_Stop_SceneInputs = {};
export type Map_Flip_HingeInputs = {};
export type Map_Flip_SwingInputs = {};
export type Map_Frame_PlanInputs = {};
export type Map_FurnitureInputs = {};
export type Map_Furniture_ArmchairInputs = {};
export type Map_Furniture_BathtubInputs = {};
export type Map_Furniture_Bed_DoubleInputs = {};
export type Map_Furniture_Bed_MediumInputs = {};
export type Map_Furniture_Bed_SingleInputs = {};
export type Map_Furniture_BoxInputs = {};
export type Map_Furniture_DescriptionInputs = {};
export type Map_Furniture_EllipseInputs = {};
export type Map_Furniture_Group_BedsInputs = {};
export type Map_Furniture_Group_FixturesInputs = {};
export type Map_Furniture_Group_ShapesInputs = {};
export type Map_Furniture_Group_SofasInputs = {};
export type Map_Furniture_SinkInputs = {};
export type Map_Furniture_SofaInputs = {};
export type Map_Furniture_Sofa_CenterInputs = {};
export type Map_Furniture_Sofa_CornerInputs = {};
export type Map_Furniture_Sofa_SideInputs = {};
export type Map_Furniture_ToiletInputs = {};
export type Map_Go_To_DeviceInputs = {};
export type Map_Go_To_GroupInputs = {};
export type Map_Hide_Neighbour_LinksInputs = {};
export type Map_Hide_Provider_MeshInputs = {
    provider: NonNullable<unknown>;
};
export type Map_Inside_PieceInputs = {
    name: NonNullable<unknown>;
};
export type Map_Keep_Corners_SquareInputs = {};
export type Map_Keep_MeasurementsInputs = {};
export type Map_Lets_Light_ThroughInputs = {};
export type Map_Link_RoomInputs = {};
export type Map_Link_Room_DescriptionInputs = {};
export type Map_Link_Room_ShortInputs = {};
export type Map_LinkedInputs = {};
export type Map_Lock_RoomInputs = {};
export type Map_Mesh_ScannedInputs = {
    time: NonNullable<unknown>;
};
export type Map_Move_Corners_FreelyInputs = {};
export type Map_Named_And_MoreInputs = {
    name: NonNullable<unknown>;
    count: NonNullable<unknown>;
};
export type Map_No_Devices_RoomInputs = {};
export type Map_Nothing_CopiedInputs = {};
export type Map_Open_DeviceInputs = {};
export type Map_Paint_BrushInputs = {};
export type Map_Paint_ColorInputs = {
    value: NonNullable<unknown>;
};
export type Map_Paint_Lights_OffInputs = {};
export type Map_Paint_Lights_OnInputs = {};
export type Map_Paint_TemperatureInputs = {
    value: NonNullable<unknown>;
};
export type Map_Paste_Copied_WallsInputs = {};
export type Map_PlacedInputs = {};
export type Map_RedoInputs = {};
export type Map_Remove_AttachInputs = {};
export type Map_Remove_From_MapInputs = {};
export type Map_Remove_From_PlanInputs = {};
export type Map_Remove_OpeningInputs = {};
export type Map_RenameInputs = {};
export type Map_Replace_AttachInputs = {};
export type Map_Room_FallbackInputs = {};
export type Map_Room_Label_PlaceholderInputs = {};
export type Map_RoomsInputs = {};
export type Map_Select_Walls_To_CopyInputs = {};
export type Map_Sensor_Conflict_DescriptionInputs = {};
export type Map_Set_Display_ColorInputs = {};
export type Map_Show_Neighbour_LinksInputs = {};
export type Map_Show_Provider_MeshInputs = {
    provider: NonNullable<unknown>;
};
export type Map_Snap_LabelInputs = {};
export type Map_Snap_OffInputs = {};
export type Map_Snap_OnInputs = {};
export type Map_ThicknessInputs = {};
export type Map_TitleInputs = {};
export type Map_Tool_AreaInputs = {};
export type Map_Tool_Cased_OpeningInputs = {};
export type Map_Tool_Cut_OpeningInputs = {};
export type Map_Tool_DoorInputs = {};
export type Map_Tool_Draw_WallsInputs = {};
export type Map_Tool_LengthInputs = {};
export type Map_Tool_MeasureInputs = {};
export type Map_Tool_MoveInputs = {};
export type Map_Tool_ResizeInputs = {};
export type Map_Tool_RotateInputs = {};
export type Map_Tool_SelectInputs = {};
export type Map_Tool_Stamp_RoomInputs = {};
export type Map_Tool_WindowInputs = {};
export type Map_UndoInputs = {};
export type Map_Unlink_RoomInputs = {};
export type Map_Unlock_RoomInputs = {};
export type Map_View_ConnectivityInputs = {};
export type Map_View_LightInputs = {};
export type Map_View_PickerInputs = {};
export type Map_View_TemperatureInputs = {};
export type Map_Wall_Thickness_AriaInputs = {};
export type Member_Add_FailedInputs = {};
export type Member_EmptyInputs = {};
export type Member_MoreInputs = {
    count: NonNullable<unknown>;
};
export type Member_SearchInputs = {};
export type Nav_ActionInputs = {};
export type Nav_Active_AlarmsInputs = {
    count: NonNullable<unknown>;
};
export type Nav_ActivityInputs = {};
export type Nav_AlarmsInputs = {};
export type Nav_AutomationsInputs = {};
export type Nav_DashboardInputs = {};
export type Nav_Data_ViewerInputs = {};
export type Nav_DevicesInputs = {};
export type Nav_EffectsInputs = {};
export type Nav_GroupsInputs = {};
export type Nav_IntegrationsInputs = {};
export type Nav_Log_OutInputs = {
    name: NonNullable<unknown>;
};
export type Nav_LogsInputs = {};
export type Nav_MaintenanceInputs = {};
export type Nav_Maintenance_TasksInputs = {
    count: NonNullable<unknown>;
};
export type Nav_MapInputs = {};
export type Nav_MonitoringInputs = {};
export type Nav_ProfileInputs = {};
export type Nav_RoomsInputs = {};
export type Nav_ScenesInputs = {};
export type Nav_SettingsInputs = {};
export type Nav_Signed_In_AsInputs = {
    name: NonNullable<unknown>;
};
export type Nav_SystemInputs = {};
export type Nav_ThingsInputs = {};
export type Nav_UsersInputs = {};
export type Nav_WebhooksInputs = {};
export type Plug_CurrentInputs = {};
export type Plug_EnergyInputs = {};
export type Plug_StatusInputs = {};
export type Plug_ToggleInputs = {};
export type Plug_VoltageInputs = {};
export type Profile_AccountInputs = {};
export type Profile_Avatar_Clear_FailedInputs = {};
export type Profile_Avatar_HelpInputs = {
    size: NonNullable<unknown>;
};
export type Profile_Avatar_Too_LargeInputs = {
    size: NonNullable<unknown>;
};
export type Profile_Avatar_Upload_FailedInputs = {};
export type Profile_Change_AvatarInputs = {};
export type Profile_Change_PasswordInputs = {};
export type Profile_Current_PasswordInputs = {};
export type Profile_Display_NameInputs = {};
export type Profile_Display_Name_EmptyInputs = {};
export type Profile_HapticsInputs = {};
export type Profile_Haptics_AboutInputs = {};
export type Profile_Haptics_EnableInputs = {};
export type Profile_Haptics_HelpInputs = {};
export type Profile_Haptics_Update_FailedInputs = {};
export type Profile_LanguageInputs = {};
export type Profile_Language_AboutInputs = {};
export type Profile_Language_HelpInputs = {};
export type Profile_Language_Update_FailedInputs = {};
export type Profile_Login_AgainInputs = {};
export type Profile_Member_SinceInputs = {};
export type Profile_Name_Update_FailedInputs = {};
export type Profile_Password_Change_FailedInputs = {};
export type Profile_Password_DescriptionInputs = {};
export type Profile_PreferencesInputs = {};
export type Profile_RemovingInputs = {};
export type Profile_Sign_Out_DescriptionInputs = {};
export type Profile_Sign_Out_EverywhereInputs = {};
export type Profile_Sign_Out_FailedInputs = {};
export type Profile_Sign_Out_SuccessInputs = {};
export type Profile_Signing_OutInputs = {};
export type Profile_Temperature_AboutInputs = {};
export type Profile_Temperature_CelsiusInputs = {};
export type Profile_Temperature_FahrenheitInputs = {};
export type Profile_Temperature_HelpInputs = {};
export type Profile_Temperature_UnitInputs = {};
export type Profile_Temperature_Update_FailedInputs = {};
export type Profile_ThemeInputs = {};
export type Profile_Theme_AboutInputs = {};
export type Profile_Theme_DarkInputs = {};
export type Profile_Theme_HelpInputs = {};
export type Profile_Theme_LightInputs = {};
export type Profile_Theme_Update_FailedInputs = {};
export type Profile_Time_12_HourInputs = {};
export type Profile_Time_24_HourInputs = {};
export type Profile_Time_FormatInputs = {};
export type Profile_Time_Format_AboutInputs = {};
export type Profile_Time_Format_HelpInputs = {};
export type Profile_Time_Update_FailedInputs = {};
export type Profile_UsernameInputs = {};
export type Room_AddInputs = {};
export type Room_Add_DescriptionInputs = {};
export type Room_Add_Device_GroupInputs = {};
export type Room_Add_GenericInputs = {};
export type Room_Add_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Room_Add_Search_DescriptionInputs = {};
export type Room_Adjust_ColorInputs = {
    name: NonNullable<unknown>;
};
export type Room_AppliancesInputs = {};
export type Room_CreateInputs = {};
export type Room_Create_DescriptionInputs = {};
export type Room_Create_FailedInputs = {};
export type Room_Create_FirstInputs = {};
export type Room_Create_MoreInputs = {};
export type Room_CreatingInputs = {};
export type Room_DeleteInputs = {};
export type Room_Delete_DescriptionInputs = {};
export type Room_Delete_FailedInputs = {};
export type Room_Delete_Many_DescriptionInputs = {};
export type Room_Delete_Many_FailedInputs = {};
export type Room_Delete_Many_TitleInputs = {
    count: NonNullable<unknown>;
};
export type Room_Delete_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Room_Drawer_DescriptionInputs = {};
export type Room_EditInputs = {};
export type Room_GenericInputs = {};
export type Room_LightsInputs = {};
export type Room_Members_EmptyInputs = {};
export type Room_NameInputs = {};
export type Room_No_LightsInputs = {};
export type Room_No_MatchInputs = {};
export type Room_NoneInputs = {};
export type Room_None_HelpInputs = {};
export type Room_Rename_FailedInputs = {};
export type Room_Save_FailedInputs = {};
export type Room_SearchInputs = {};
export type Scene_Action_ApplyInputs = {};
export type Scene_Action_StopInputs = {};
export type Scene_Add_SourceInputs = {};
export type Scene_Apply_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Scene_BackInputs = {};
export type Scene_Choose_IconInputs = {};
export type Scene_Create_Add_SelectorInputs = {};
export type Scene_Create_Adjust_LightingInputs = {};
export type Scene_Create_BackInputs = {};
export type Scene_Create_BreadcrumbInputs = {};
export type Scene_Create_BuildingInputs = {};
export type Scene_Create_Choose_LocationInputs = {};
export type Scene_Create_Choose_LookInputs = {};
export type Scene_Create_CreatingInputs = {};
export type Scene_Create_Error_Choose_VibeInputs = {};
export type Scene_Create_Error_CreateInputs = {};
export type Scene_Create_Full_ColorInputs = {};
export type Scene_Create_Loading_GalleryInputs = {};
export type Scene_Create_Name_PlaceholderInputs = {};
export type Scene_Create_Name_TitleInputs = {};
export type Scene_Create_No_GalleryInputs = {};
export type Scene_Create_Photo_AtmosphereInputs = {};
export type Scene_Create_Photo_FormatsInputs = {};
export type Scene_Create_Photo_PrivacyInputs = {};
export type Scene_Create_Supporting_DescriptionInputs = {};
export type Scene_Create_TitleInputs = {};
export type Scene_Create_Turn_OnInputs = {
    name: NonNullable<unknown>;
};
export type Scene_Create_Vibe_Preview_EmptyInputs = {};
export type Scene_Create_Whites_OnlyInputs = {};
export type Scene_Editor_AddInputs = {};
export type Scene_Editor_Add_Lighting_TargetsInputs = {};
export type Scene_Editor_Add_SelectorInputs = {};
export type Scene_Editor_Add_SupportingInputs = {};
export type Scene_Editor_Add_Supporting_DescriptionInputs = {};
export type Scene_Editor_Adjust_DeviceInputs = {
    name: NonNullable<unknown>;
};
export type Scene_Editor_BrightnessInputs = {};
export type Scene_Editor_CaptureInputs = {};
export type Scene_Editor_Capture_AllInputs = {};
export type Scene_Editor_ChangeInputs = {};
export type Scene_Editor_Change_SourceInputs = {};
export type Scene_Editor_Choose_EffectInputs = {
    name: NonNullable<unknown>;
};
export type Scene_Editor_Choose_TargetsInputs = {};
export type Scene_Editor_ClearInputs = {};
export type Scene_Editor_Clear_OverrideInputs = {
    name: NonNullable<unknown>;
};
export type Scene_Editor_ColorInputs = {};
export type Scene_Editor_DevicesInputs = {};
export type Scene_Editor_DoneInputs = {};
export type Scene_Editor_EditInputs = {};
export type Scene_Editor_Edit_ItemInputs = {
    name: NonNullable<unknown>;
};
export type Scene_Editor_Edit_SelectorInputs = {};
export type Scene_Editor_EffectInputs = {};
export type Scene_Editor_EmptyInputs = {};
export type Scene_Editor_GroupsInputs = {};
export type Scene_Editor_LightingInputs = {};
export type Scene_Editor_LiveInputs = {};
export type Scene_Editor_Live_PowerInputs = {
    name: NonNullable<unknown>;
};
export type Scene_Editor_MovementInputs = {};
export type Scene_Editor_Movement_AliveInputs = {};
export type Scene_Editor_Movement_FlowingInputs = {};
export type Scene_Editor_Movement_GentleInputs = {};
export type Scene_Editor_Movement_StillInputs = {};
export type Scene_Editor_Nesting_LimitInputs = {};
export type Scene_Editor_OffInputs = {};
export type Scene_Editor_Output_SimplifiedInputs = {};
export type Scene_Editor_Output_SummaryInputs = {
    sceneLights: NonNullable<unknown>;
    zigbeeLights: NonNullable<unknown>;
    interval: NonNullable<unknown>;
};
export type Scene_Editor_Output_Too_FastInputs = {};
export type Scene_Editor_PaceInputs = {};
export type Scene_Editor_PowerInputs = {};
export type Scene_Editor_RemoveInputs = {};
export type Scene_Editor_Remove_ItemInputs = {
    name: NonNullable<unknown>;
};
export type Scene_Editor_Remove_SourceInputs = {};
export type Scene_Editor_RoomsInputs = {};
export type Scene_Editor_SelectorInputs = {};
export type Scene_Editor_Selector_NameInputs = {};
export type Scene_Editor_Set_PowerInputs = {
    name: NonNullable<unknown>;
};
export type Scene_Editor_ShuffleInputs = {};
export type Scene_Editor_SimpleInputs = {};
export type Scene_Editor_StateInputs = {};
export type Scene_Editor_Supporting_DevicesInputs = {};
export type Scene_Editor_TargetsInputs = {};
export type Scene_Error_SaveInputs = {};
export type Scene_FallbackInputs = {};
export type Scene_GenericInputs = {};
export type Scene_LoadingInputs = {};
export type Scene_Name_AriaInputs = {};
export type Scene_Not_FoundInputs = {};
export type Scene_Stop_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Scenes_Add_TargetInputs = {};
export type Scenes_Add_TargetsInputs = {};
export type Scenes_Add_Targets_DescriptionInputs = {};
export type Scenes_Add_Targets_ToInputs = {
    name: NonNullable<unknown>;
};
export type Scenes_ApplyInputs = {};
export type Scenes_Column_BreakdownInputs = {};
export type Scenes_Column_Created_ByInputs = {};
export type Scenes_Column_NameInputs = {};
export type Scenes_Column_RoomsInputs = {};
export type Scenes_Column_TargetsInputs = {};
export type Scenes_CreateInputs = {};
export type Scenes_Create_FirstInputs = {};
export type Scenes_Create_ShortInputs = {};
export type Scenes_Delete_DescriptionInputs = {
    name: NonNullable<unknown>;
};
export type Scenes_Delete_Many_DescriptionInputs = {};
export type Scenes_Delete_Many_TitleInputs = {
    count: NonNullable<unknown>;
};
export type Scenes_Delete_TitleInputs = {};
export type Scenes_Device_CountInputs = {
    count: NonNullable<unknown>;
};
export type Scenes_DevicesInputs = {};
export type Scenes_EditInputs = {};
export type Scenes_EmptyInputs = {};
export type Scenes_Empty_HelpInputs = {};
export type Scenes_Error_ApplyInputs = {};
export type Scenes_Error_DeleteInputs = {};
export type Scenes_Error_Delete_ManyInputs = {};
export type Scenes_Error_IconInputs = {};
export type Scenes_Error_RenameInputs = {};
export type Scenes_Error_StopInputs = {};
export type Scenes_Error_UpdateInputs = {};
export type Scenes_Filter_DeviceInputs = {};
export type Scenes_Filter_EmptyInputs = {};
export type Scenes_Filter_GroupInputs = {};
export type Scenes_Filter_RoomInputs = {};
export type Scenes_Filter_TargetInputs = {};
export type Scenes_GroupsInputs = {};
export type Scenes_LoadingInputs = {};
export type Scenes_Member_CountInputs = {
    count: NonNullable<unknown>;
};
export type Scenes_No_MatchInputs = {};
export type Scenes_No_TargetsInputs = {};
export type Scenes_RoomsInputs = {};
export type Scenes_SearchInputs = {};
export type Scenes_SelectInputs = {
    name: NonNullable<unknown>;
};
export type Scenes_StopInputs = {};
export type Scenes_Target_CountInputs = {
    count: NonNullable<unknown>;
};
export type Scenes_TitleInputs = {};
export type Sensor_ContactInputs = {};
export type Sensor_Current_ReadingsInputs = {};
export type Sensor_DetailsInputs = {};
export type Sensor_Device_PostureInputs = {};
export type Sensor_DoorInputs = {};
export type Sensor_HumidityInputs = {};
export type Sensor_IlluminanceInputs = {};
export type Sensor_No_ReadingsInputs = {};
export type Sensor_OrientationInputs = {};
export type Sensor_PressureInputs = {};
export type Sensor_TemperatureInputs = {};
export type Sensor_WindowInputs = {};
export type Settings_HistoryInputs = {};
export type Settings_InternalsInputs = {};
export type Settings_Log_DebugInputs = {};
export type Settings_Log_ErrorInputs = {};
export type Settings_Log_InfoInputs = {};
export type Settings_Log_LevelInputs = {};
export type Settings_Log_WarnInputs = {};
export type Settings_Retention_AriaInputs = {};
export type Settings_Retention_DaysInputs = {};
export type Settings_Retention_HelpInputs = {};
export type Settings_Save_FailedInputs = {};
export type Shared_ActionsInputs = {};
export type Shared_Add_ItemsInputs = {
    count: NonNullable<unknown>;
};
export type Shared_Batch_ActionsInputs = {};
export type Shared_Choose_IconInputs = {};
export type Shared_Clear_SelectionInputs = {};
export type Shared_ColumnsInputs = {};
export type Shared_Columns_RestoreInputs = {};
export type Shared_Columns_ShowInputs = {};
export type Shared_Date_EndInputs = {};
export type Shared_Date_FromInputs = {};
export type Shared_Date_Last_DaysInputs = {
    count: NonNullable<unknown>;
};
export type Shared_Date_Last_HourInputs = {};
export type Shared_Date_Last_HoursInputs = {
    count: NonNullable<unknown>;
};
export type Shared_Date_Last_YearInputs = {};
export type Shared_Date_Pick_RangeInputs = {};
export type Shared_Date_RangeInputs = {};
export type Shared_Date_StartInputs = {};
export type Shared_Date_ToInputs = {};
export type Shared_Device_CountInputs = {
    count: NonNullable<unknown>;
};
export type Shared_FiltersInputs = {};
export type Shared_Group_CountInputs = {
    count: NonNullable<unknown>;
};
export type Shared_Member_CountInputs = {
    count: NonNullable<unknown>;
};
export type Shared_Multi_RoomInputs = {};
export type Shared_Next_MonthInputs = {};
export type Shared_No_MatchesInputs = {};
export type Shared_No_ResultsInputs = {};
export type Shared_No_Results_FoundInputs = {};
export type Shared_No_TargetsInputs = {};
export type Shared_Number_DecreaseInputs = {};
export type Shared_Number_IncreaseInputs = {};
export type Shared_Pick_ItemInputs = {};
export type Shared_Previous_MonthInputs = {};
export type Shared_Room_CountInputs = {
    count: NonNullable<unknown>;
};
export type Shared_Select_AllInputs = {};
export type Shared_Select_All_RowsInputs = {};
export type Shared_Select_ItemInputs = {
    name: NonNullable<unknown>;
};
export type Shared_Select_RowInputs = {};
export type Shared_Selected_CountInputs = {
    count: NonNullable<unknown>;
};
export type Shared_Selector_CountInputs = {
    count: NonNullable<unknown>;
};
export type Shared_Show_MembersInputs = {
    name: NonNullable<unknown>;
};
export type Shared_SidebarInputs = {};
export type Shared_Sidebar_DescriptionInputs = {};
export type Shared_Sidebar_ToggleInputs = {};
export type Shared_Unsaved_DescriptionInputs = {};
export type Shared_Unsaved_LeaveInputs = {};
export type Shared_Unsaved_StayInputs = {};
export type Shared_Unsaved_TitleInputs = {};
export type Shared_View_CardsInputs = {};
export type Shared_View_Cards_AriaInputs = {};
export type Shared_View_TableInputs = {};
export type Shared_View_Table_AriaInputs = {};
export type Standard_Room_ApartmentInputs = {};
export type Standard_Room_AtticInputs = {};
export type Standard_Room_BackyardInputs = {};
export type Standard_Room_BalconyInputs = {};
export type Standard_Room_BasementInputs = {};
export type Standard_Room_BathroomInputs = {};
export type Standard_Room_BedroomInputs = {};
export type Standard_Room_Boiler_RoomInputs = {};
export type Standard_Room_CellarInputs = {};
export type Standard_Room_Childrens_RoomInputs = {};
export type Standard_Room_ClosetInputs = {};
export type Standard_Room_ConservatoryInputs = {};
export type Standard_Room_CourtyardInputs = {};
export type Standard_Room_DeckInputs = {};
export type Standard_Room_Dining_RoomInputs = {};
export type Standard_Room_Dressing_RoomInputs = {};
export type Standard_Room_DrivewayInputs = {};
export type Standard_Room_EntrywayInputs = {};
export type Standard_Room_Front_YardInputs = {};
export type Standard_Room_Game_RoomInputs = {};
export type Standard_Room_GarageInputs = {};
export type Standard_Room_GardenInputs = {};
export type Standard_Room_GreenhouseInputs = {};
export type Standard_Room_Guest_BathroomInputs = {};
export type Standard_Room_Guest_BedroomInputs = {};
export type Standard_Room_Guest_RoomInputs = {};
export type Standard_Room_GymInputs = {};
export type Standard_Room_HallwayInputs = {};
export type Standard_Room_Home_OfficeInputs = {};
export type Standard_Room_Home_TheaterInputs = {};
export type Standard_Room_KitchenInputs = {};
export type Standard_Room_KitchenetteInputs = {};
export type Standard_Room_LandingInputs = {};
export type Standard_Room_Laundry_RoomInputs = {};
export type Standard_Room_LibraryInputs = {};
export type Standard_Room_Living_RoomInputs = {};
export type Standard_Room_LobbyInputs = {};
export type Standard_Room_Master_BathroomInputs = {};
export type Standard_Room_Master_BedroomInputs = {};
export type Standard_Room_Media_RoomInputs = {};
export type Standard_Room_MudroomInputs = {};
export type Standard_Room_Music_RoomInputs = {};
export type Standard_Room_NurseryInputs = {};
export type Standard_Room_OfficeInputs = {};
export type Standard_Room_PantryInputs = {};
export type Standard_Room_ParkingInputs = {};
export type Standard_Room_PatioInputs = {};
export type Standard_Room_PlayroomInputs = {};
export type Standard_Room_PoolInputs = {};
export type Standard_Room_PorchInputs = {};
export type Standard_Room_Powder_RoomInputs = {};
export type Standard_Room_ReceptionInputs = {};
export type Standard_Room_RoofInputs = {};
export type Standard_Room_SaunaInputs = {};
export type Standard_Room_Server_RoomInputs = {};
export type Standard_Room_ShedInputs = {};
export type Standard_Room_Shower_RoomInputs = {};
export type Standard_Room_SpaInputs = {};
export type Standard_Room_StaircaseInputs = {};
export type Standard_Room_Storage_RoomInputs = {};
export type Standard_Room_StudioInputs = {};
export type Standard_Room_StudyInputs = {};
export type Standard_Room_SunroomInputs = {};
export type Standard_Room_TerraceInputs = {};
export type Standard_Room_ToiletInputs = {};
export type Standard_Room_Utility_RoomInputs = {};
export type Standard_Room_Waiting_RoomInputs = {};
export type Standard_Room_Walk_In_ClosetInputs = {};
export type Standard_Room_WardrobeInputs = {};
export type Standard_Room_WorkshopInputs = {};
export type State_AvailableInputs = {};
export type State_BatteryInputs = {
    percent: NonNullable<unknown>;
};
export type State_ClearInputs = {};
export type State_Climate_TargetInputs = {
    temperature: NonNullable<unknown>;
};
export type State_ClosedInputs = {};
export type State_Light_On_BrightnessInputs = {
    percent: NonNullable<unknown>;
};
export type State_Motion_DetectedInputs = {};
export type State_No_DataInputs = {};
export type State_No_MotionInputs = {};
export type State_OccupiedInputs = {};
export type State_OffInputs = {};
export type State_OnInputs = {};
export type State_OpenInputs = {};
export type State_Plug_PowerInputs = {
    state: NonNullable<unknown>;
    power: NonNullable<unknown>;
};
export type State_UnavailableInputs = {};
export type State_UnknownInputs = {};
export type Static_App_DescriptionInputs = {};
export type Target_Cap_DimmingInputs = {};
export type Target_Cap_Full_ColorInputs = {};
export type Target_Cap_SwitchableInputs = {};
export type Target_Cap_Tunable_WhiteInputs = {};
export type Target_Connector_AndInputs = {};
export type Target_Connector_OrInputs = {};
export type Target_Device_CountInputs = {
    count: NonNullable<unknown>;
};
export type Target_Done_RuleInputs = {};
export type Target_No_MatchesInputs = {};
export type Target_Op_ExcludesInputs = {};
export type Target_Op_IncludesInputs = {};
export type Target_Op_Includes_AnyInputs = {};
export type Target_Op_Includes_NoneInputs = {};
export type Target_Op_IsInputs = {};
export type Target_Op_Is_NotInputs = {};
export type Target_Op_Is_Not_One_OfInputs = {};
export type Target_Op_Is_One_OfInputs = {};
export type Target_Placeholder_Add_RuleInputs = {};
export type Target_Placeholder_ConnectorInputs = {};
export type Target_Placeholder_FieldInputs = {};
export type Target_Placeholder_IncludesInputs = {};
export type Target_Placeholder_OperatorInputs = {};
export type Target_Placeholder_ValueInputs = {};
export type Target_Remove_RuleInputs = {};
export type Target_RemovedInputs = {
    name: NonNullable<unknown>;
};
export type Target_Subject_DeviceInputs = {};
export type Target_Subject_Device_RoleInputs = {};
export type Target_Subject_Device_TypeInputs = {};
export type Target_Subject_GroupInputs = {};
export type Target_Subject_ReportedInputs = {};
export type Target_Subject_RoomInputs = {};
export type Target_Subject_WritableInputs = {};
export type Target_Type_FilterInputs = {};
export type Temperature_Picker_AriaInputs = {};
export type Time_Just_NowInputs = {};
export type Translation_CardInputs = {};
export type Translation_Default_HelpInputs = {};
export type Translation_Default_LanguageInputs = {};
export type Translation_NamesInputs = {};
export type Translation_Source_LanguageInputs = {};
export type Translation_Standard_RoomsInputs = {};
export type Translation_Standard_Rooms_HelpInputs = {};
export type Tuya_Access_IdInputs = {};
export type Tuya_Access_SecretInputs = {};
export type Tuya_Check_ConnectionInputs = {};
export type Tuya_Cloud_KeysInputs = {};
export type Tuya_Cloud_Step_AccountInputs = {};
export type Tuya_Cloud_Step_AppInputs = {};
export type Tuya_Cloud_Step_KeysInputs = {};
export type Tuya_Cloud_Step_ProjectInputs = {};
export type Tuya_EnabledInputs = {};
export type Tuya_RegionInputs = {};
export type Tuya_Region_CnInputs = {};
export type Tuya_Region_EuInputs = {};
export type Tuya_Region_InInputs = {};
export type Tuya_Region_UsInputs = {};
export type Tuya_Save_FailedInputs = {};
export type Tuya_Secret_KeepInputs = {};
export type Tuya_Select_RegionInputs = {};
export type Tuya_Sync_DevicesInputs = {};
export type Tuya_Sync_FailedInputs = {};
export type Tuya_SyncedInputs = {
    count: NonNullable<unknown>;
};
export type Users_Cannot_Delete_SelfInputs = {};
export type Users_Column_ExpiresInputs = {};
export type Users_Column_NameInputs = {};
export type Users_Column_TypeInputs = {};
export type Users_Column_UsernameInputs = {};
export type Users_CreateInputs = {};
export type Users_Create_DescriptionInputs = {};
export type Users_Create_FailedInputs = {};
export type Users_Create_ShortInputs = {};
export type Users_CreatedInputs = {};
export type Users_CreatingInputs = {};
export type Users_Delete_DescriptionInputs = {
    name: NonNullable<unknown>;
};
export type Users_Delete_FailedInputs = {};
export type Users_Delete_Many_DescriptionInputs = {};
export type Users_Delete_Many_FailedInputs = {};
export type Users_Delete_Many_TitleInputs = {
    count: NonNullable<unknown>;
};
export type Users_Delete_TitleInputs = {};
export type Users_DeletedInputs = {
    name: NonNullable<unknown>;
};
export type Users_Deleted_CountInputs = {
    count: NonNullable<unknown>;
};
export type Users_DeletingInputs = {};
export type Users_Display_NameInputs = {};
export type Users_Loading_AccountsInputs = {};
export type Users_New_PasswordInputs = {};
export type Users_No_Account_MatchInputs = {};
export type Users_Password_ResetInputs = {
    name: NonNullable<unknown>;
};
export type Users_Reset_DescriptionInputs = {
    name: NonNullable<unknown>;
};
export type Users_Reset_FailedInputs = {};
export type Users_Reset_PasswordInputs = {};
export type Users_SavingInputs = {};
export type Users_Search_AccountsInputs = {};
export type Users_TypeInputs = {};
export type Value_AbnormalInputs = {};
export type Value_AutoInputs = {};
export type Value_BackInputs = {};
export type Value_BothInputs = {};
export type Value_CoolInputs = {};
export type Value_DownInputs = {};
export type Value_DryInputs = {};
export type Value_FalseInputs = {};
export type Value_FanInputs = {};
export type Value_Fan_OnlyInputs = {};
export type Value_FrontInputs = {};
export type Value_HeatInputs = {};
export type Value_HighInputs = {};
export type Value_LeftInputs = {};
export type Value_LowInputs = {};
export type Value_MidInputs = {};
export type Value_NormalInputs = {};
export type Value_RightInputs = {};
export type Value_TiltInputs = {};
export type Value_TrueInputs = {};
export type Value_UpInputs = {};
export type Vibe_Build_FailedInputs = {};
export type Vibe_BuildingInputs = {};
export type Vibe_Category_AtmosphereInputs = {};
export type Vibe_Category_NatureInputs = {};
export type Vibe_Category_UnknownInputs = {
    id: NonNullable<unknown>;
};
export type Vibe_Category_WhitesInputs = {};
export type Vibe_Choices_FailedInputs = {};
export type Vibe_Choices_RoundInputs = {
    round: NonNullable<unknown>;
};
export type Vibe_Choose_ClosestInputs = {};
export type Vibe_Choose_PhotoInputs = {};
export type Vibe_ColorsInputs = {};
export type Vibe_Domain_Full_ColorInputs = {};
export type Vibe_Domain_White_AmbienceInputs = {};
export type Vibe_GalleryInputs = {};
export type Vibe_Guide_AmberInputs = {};
export type Vibe_Guide_BalancedInputs = {};
export type Vibe_Guide_BrighterInputs = {};
export type Vibe_Guide_CandlelightInputs = {};
export type Vibe_Guide_CoolInputs = {};
export type Vibe_Guide_CoolerInputs = {};
export type Vibe_Guide_DaylightInputs = {};
export type Vibe_Guide_EmberInputs = {};
export type Vibe_Guide_GoldInputs = {};
export type Vibe_Guide_IndigoInputs = {};
export type Vibe_Guide_LagoonInputs = {};
export type Vibe_Guide_LeafInputs = {};
export type Vibe_Guide_MeadowInputs = {};
export type Vibe_Guide_MintInputs = {};
export type Vibe_Guide_NeutralInputs = {};
export type Vibe_Guide_OrchidInputs = {};
export type Vibe_Guide_RoseInputs = {};
export type Vibe_Guide_SkyInputs = {};
export type Vibe_Guide_SofterInputs = {};
export type Vibe_Guide_UnknownInputs = {
    id: NonNullable<unknown>;
};
export type Vibe_Guide_VioletInputs = {};
export type Vibe_Guide_WarmInputs = {};
export type Vibe_Guide_WarmerInputs = {};
export type Vibe_GuidedInputs = {};
export type Vibe_Load_FailedInputs = {};
export type Vibe_Loading_ChoicesInputs = {};
export type Vibe_PhotoInputs = {};
export type Vibe_Photo_FailedInputs = {};
export type Vibe_Preset_Aurora_HazeInputs = {};
export type Vibe_Preset_CandlelightInputs = {};
export type Vibe_Preset_Cool_MorningInputs = {};
export type Vibe_Preset_Ember_HearthInputs = {};
export type Vibe_Preset_Forest_CanopyInputs = {};
export type Vibe_Preset_Neutral_FocusInputs = {};
export type Vibe_Preset_Night_SkyInputs = {};
export type Vibe_Preset_Ocean_DriftInputs = {};
export type Vibe_Preset_Sunset_GlowInputs = {};
export type Vibe_Preset_UnknownInputs = {
    id: NonNullable<unknown>;
};
export type Vibe_Preset_Warm_EveningInputs = {};
export type Vibe_Preview_Aria_EmptyInputs = {};
export type Vibe_Preview_Aria_SwatchesInputs = {
    count: NonNullable<unknown>;
};
export type Vibe_Replace_PhotoInputs = {};
export type Vibe_Source_Gallery_DetailInputs = {};
export type Vibe_Source_Guided_DetailInputs = {};
export type Vibe_Source_IndividualInputs = {};
export type Vibe_Source_Individual_DetailInputs = {};
export type Vibe_Source_Photo_DetailInputs = {};
export type Vibe_UseInputs = {};
export type Vibe_WhitesInputs = {};
export type Webhooks_Accept_RequestsInputs = {};
export type Webhooks_Automation_CountInputs = {
    count: NonNullable<unknown>;
};
export type Webhooks_Body_CopiedInputs = {};
export type Webhooks_Body_UnavailableInputs = {};
export type Webhooks_Column_AutomationsInputs = {};
export type Webhooks_Column_Created_ByInputs = {};
export type Webhooks_Column_Last_RequestInputs = {};
export type Webhooks_Column_NameInputs = {};
export type Webhooks_ContentInputs = {};
export type Webhooks_CopiedInputs = {};
export type Webhooks_Copy_BodyInputs = {};
export type Webhooks_Copy_UrlInputs = {};
export type Webhooks_CreateInputs = {};
export type Webhooks_Create_DescriptionInputs = {};
export type Webhooks_Create_FailedInputs = {};
export type Webhooks_Create_FirstInputs = {};
export type Webhooks_Create_ShortInputs = {};
export type Webhooks_CreatingInputs = {};
export type Webhooks_Delete_DescriptionInputs = {
    name: NonNullable<unknown>;
};
export type Webhooks_Delete_FailedInputs = {};
export type Webhooks_Delete_Many_FailedInputs = {};
export type Webhooks_Delete_Many_TitleInputs = {};
export type Webhooks_Delete_Many_With_HistoryInputs = {
    count: NonNullable<unknown>;
};
export type Webhooks_Delete_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Webhooks_Delete_TitleInputs = {};
export type Webhooks_Delete_Used_KeptInputs = {};
export type Webhooks_Delete_With_HistoryInputs = {
    name: NonNullable<unknown>;
};
export type Webhooks_Detail_FallbackInputs = {};
export type Webhooks_Disable_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Webhooks_DisabledInputs = {};
export type Webhooks_DoneInputs = {};
export type Webhooks_DurationInputs = {};
export type Webhooks_Edit_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Webhooks_EmptyInputs = {};
export type Webhooks_Empty_HelpInputs = {};
export type Webhooks_Enable_NamedInputs = {
    name: NonNullable<unknown>;
};
export type Webhooks_EnabledInputs = {};
export type Webhooks_Filter_StatusInputs = {};
export type Webhooks_Filter_UsageInputs = {};
export type Webhooks_HeadersInputs = {};
export type Webhooks_Latest_CountInputs = {
    count: NonNullable<unknown>;
};
export type Webhooks_NameInputs = {};
export type Webhooks_Name_PlaceholderInputs = {};
export type Webhooks_No_AutomationsInputs = {};
export type Webhooks_No_Content_TypeInputs = {};
export type Webhooks_No_MatchInputs = {};
export type Webhooks_No_RequestsInputs = {};
export type Webhooks_Not_FoundInputs = {};
export type Webhooks_Outcome_AcceptedInputs = {};
export type Webhooks_Outcome_DisabledInputs = {};
export type Webhooks_Outcome_Invalid_JsonInputs = {};
export type Webhooks_Outcome_Rate_LimitedInputs = {};
export type Webhooks_Outcome_Too_LargeInputs = {};
export type Webhooks_Outcome_UnknownInputs = {
    outcome: NonNullable<unknown>;
};
export type Webhooks_Query_KeysInputs = {};
export type Webhooks_ReceivedInputs = {};
export type Webhooks_Recent_RequestsInputs = {};
export type Webhooks_Rename_FailedInputs = {};
export type Webhooks_Request_BodyInputs = {};
export type Webhooks_Request_IdInputs = {};
export type Webhooks_RequestsInputs = {};
export type Webhooks_ResultInputs = {};
export type Webhooks_Rotate_DescriptionInputs = {};
export type Webhooks_Rotate_FailedInputs = {};
export type Webhooks_Rotate_ShortInputs = {};
export type Webhooks_Rotate_TitleInputs = {};
export type Webhooks_Rotate_UrlInputs = {};
export type Webhooks_Save_FailedInputs = {};
export type Webhooks_SearchInputs = {};
export type Webhooks_Search_AutomationsInputs = {};
export type Webhooks_SizeInputs = {};
export type Webhooks_Source_IpInputs = {};
export type Webhooks_TitleInputs = {};
export type Webhooks_UnusedInputs = {};
export type Webhooks_Update_FailedInputs = {};
export type Webhooks_Url_OnceInputs = {};
export type Webhooks_Url_TitleInputs = {};
export type Webhooks_UsedInputs = {};
export type Webhooks_Used_ByInputs = {};
export type Webhooks_Used_By_AutomationInputs = {};
export type Webhooks_User_AgentInputs = {};
export type Webhooks_Validation_NameInputs = {};
export type Webhooks_Validation_Request_CountInputs = {};
export type Webhooks_Validation_WindowInputs = {};
export type Webhooks_View_BodyInputs = {};
export type Webhooks_Window_MsInputs = {};
export type Zigbee_AdapterInputs = {};
export type Zigbee_Address_VendorInputs = {};
export type Zigbee_AttributeInputs = {};
export type Zigbee_Battery_TypeInputs = {};
export type Zigbee_BindingsInputs = {};
export type Zigbee_Broker_AddressInputs = {};
export type Zigbee_ChangeInputs = {};
export type Zigbee_ChannelInputs = {};
export type Zigbee_Check_ConnectionInputs = {};
export type Zigbee_ClusterInputs = {};
export type Zigbee_Command_TrafficInputs = {};
export type Zigbee_Command_Traffic_AboutInputs = {};
export type Zigbee_Command_Traffic_HelpInputs = {};
export type Zigbee_CommitInputs = {};
export type Zigbee_Config_Save_FailedInputs = {};
export type Zigbee_Connect_Step_AvailabilityInputs = {};
export type Zigbee_Connect_Step_BrokerInputs = {};
export type Zigbee_Connect_Step_RegistryInputs = {};
export type Zigbee_ConnectingInputs = {};
export type Zigbee_Continuous_RateInputs = {};
export type Zigbee_Continuous_Rate_AboutInputs = {};
export type Zigbee_Continuous_Rate_HelpInputs = {};
export type Zigbee_ConvertersInputs = {};
export type Zigbee_CoordinatorInputs = {};
export type Zigbee_Date_CodeInputs = {};
export type Zigbee_DefinitionInputs = {};
export type Zigbee_DescriptionInputs = {};
export type Zigbee_DetailsInputs = {};
export type Zigbee_DeviceInputs = {};
export type Zigbee_EnabledInputs = {};
export type Zigbee_EndpointInputs = {};
export type Zigbee_Endpoint_NamedInputs = {
    id: NonNullable<unknown>;
};
export type Zigbee_EndpointsInputs = {};
export type Zigbee_Extended_Pan_IdInputs = {};
export type Zigbee_FirmwareInputs = {};
export type Zigbee_Frontend_UrlInputs = {};
export type Zigbee_Frontend_Url_HelpInputs = {};
export type Zigbee_Frontend_Url_InvalidInputs = {};
export type Zigbee_Frontend_Url_RestrictedInputs = {};
export type Zigbee_Group_IdInputs = {};
export type Zigbee_Group_NamedInputs = {
    id: NonNullable<unknown>;
};
export type Zigbee_GroupsInputs = {};
export type Zigbee_Ieee_AddressInputs = {};
export type Zigbee_Input_ClustersInputs = {};
export type Zigbee_IntegrationInputs = {};
export type Zigbee_Interactive_RateInputs = {};
export type Zigbee_Interactive_Rate_AboutInputs = {};
export type Zigbee_Interactive_Rate_HelpInputs = {};
export type Zigbee_InterviewInputs = {};
export type Zigbee_Last_ScannedInputs = {
    time: NonNullable<unknown>;
};
export type Zigbee_ManufacturerInputs = {};
export type Zigbee_MaxInputs = {};
export type Zigbee_MinInputs = {};
export type Zigbee_ModelInputs = {};
export type Zigbee_Model_IdInputs = {};
export type Zigbee_Mqtt_TopicInputs = {};
export type Zigbee_NetworkInputs = {};
export type Zigbee_Network_AddressInputs = {};
export type Zigbee_Network_RoleInputs = {};
export type Zigbee_Never_ScannedInputs = {};
export type Zigbee_No_BindingsInputs = {};
export type Zigbee_No_EndpointsInputs = {};
export type Zigbee_No_ReportingInputs = {};
export type Zigbee_Not_In_GroupInputs = {};
export type Zigbee_OptionalInputs = {};
export type Zigbee_Ota_ProgressInputs = {
    state: NonNullable<unknown>;
    progress: NonNullable<unknown>;
};
export type Zigbee_Ota_VersionInputs = {
    state: NonNullable<unknown>;
    version: NonNullable<unknown>;
};
export type Zigbee_Ota_Version_ProgressInputs = {
    state: NonNullable<unknown>;
    version: NonNullable<unknown>;
    progress: NonNullable<unknown>;
};
export type Zigbee_Output_ClustersInputs = {};
export type Zigbee_Pan_IdInputs = {};
export type Zigbee_PasswordInputs = {};
export type Zigbee_Password_KeepInputs = {};
export type Zigbee_Power_SourceInputs = {};
export type Zigbee_Profile_IdInputs = {};
export type Zigbee_Rate_Continuous_InvalidInputs = {};
export type Zigbee_Rate_Interactive_InvalidInputs = {};
export type Zigbee_Rate_Order_InvalidInputs = {};
export type Zigbee_Reconnect_HelpInputs = {};
export type Zigbee_ReportingInputs = {};
export type Zigbee_Runs_Daily_AtInputs = {};
export type Zigbee_Scan_CompleteInputs = {};
export type Zigbee_Scan_HourInputs = {};
export type Zigbee_Scan_MinuteInputs = {};
export type Zigbee_Scan_NetworkInputs = {};
export type Zigbee_Scan_Start_FailedInputs = {};
export type Zigbee_ScanningInputs = {
    duration: NonNullable<unknown>;
};
export type Zigbee_Scheduled_ScanInputs = {};
export type Zigbee_Software_BuildInputs = {};
export type Zigbee_SupportInputs = {};
export type Zigbee_TargetInputs = {};
export type Zigbee_TopologyInputs = {};
export type Zigbee_Topology_AboutInputs = {};
export type Zigbee_Topology_HelpInputs = {};
export type Zigbee_Unknown_VersionInputs = {};
export type Zigbee_Use_WssInputs = {};
export type Zigbee_UsernameInputs = {};
export type Zigbee_VendorInputs = {};
