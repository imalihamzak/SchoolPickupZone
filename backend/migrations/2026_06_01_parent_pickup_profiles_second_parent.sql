-- Parent pickup profile and separate second-parent slot.
-- Second parents use the existing guardian/vehicle pickup mechanics without consuming the 2 guardian slots.

ALTER TABLE `guardians`
  ADD COLUMN IF NOT EXISTS `contact_type` varchar(30) NOT NULL DEFAULT 'guardian' AFTER `status`;

CREATE INDEX IF NOT EXISTS `idx_guardians_user_contact_type`
  ON `guardians` (`user_id`, `contact_type`);

CREATE TABLE IF NOT EXISTS `parent_pickup_profiles` (
  `user_id` int(11) NOT NULL,
  `relation` varchar(50) DEFAULT NULL,
  `vehicle_name` varchar(100) DEFAULT NULL,
  `vehicle_make` varchar(100) DEFAULT NULL,
  `vehicle_model` varchar(100) DEFAULT NULL,
  `vehicle_color` varchar(50) DEFAULT NULL,
  `vehicle_plate_number` varchar(50) DEFAULT NULL,
  `vehicle_year` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
