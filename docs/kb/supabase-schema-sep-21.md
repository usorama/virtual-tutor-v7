| table_schema | table_name          | column_name                    | data_type                   | is_nullable | column_default                                  |
| ------------ | ------------------- | ------------------------------ | --------------------------- | ----------- | ----------------------------------------------- |
| public       | active_sessions     | id                             | integer                     | YES         | null                                            |
| public       | active_sessions     | session_id                     | uuid                        | YES         | null                                            |
| public       | active_sessions     | created_at                     | timestamp without time zone | YES         | null                                            |
| public       | active_sessions     | ended_at                       | timestamp without time zone | YES         | null                                            |
| public       | active_sessions     | status                         | character varying           | YES         | null                                            |
| public       | active_sessions     | subject                        | character varying           | YES         | null                                            |
| public       | active_sessions     | grade_level                    | integer                     | YES         | null                                            |
| public       | active_sessions     | learning_objectives            | ARRAY                       | YES         | null                                            |
| public       | analytics_events    | id                             | uuid                        | NO          | uuid_generate_v4()                              |
| public       | analytics_events    | user_id                        | uuid                        | YES         | null                                            |
| public       | analytics_events    | session_id                     | uuid                        | YES         | null                                            |
| public       | analytics_events    | event_type                     | character varying           | NO          | null                                            |
| public       | analytics_events    | event_data                     | jsonb                       | YES         | null                                            |
| public       | analytics_events    | created_at                     | timestamp with time zone    | YES         | now()                                           |
| public       | assessments         | id                             | integer                     | NO          | nextval('assessments_id_seq'::regclass)         |
| public       | assessments         | session_id                     | uuid                        | YES         | null                                            |
| public       | assessments         | question_type                  | character varying           | YES         | null                                            |
| public       | assessments         | question_text                  | text                        | YES         | null                                            |
| public       | assessments         | question_context               | jsonb                       | YES         | null                                            |
| public       | assessments         | student_answer                 | text                        | YES         | null                                            |
| public       | assessments         | correct_answer                 | text                        | YES         | null                                            |
| public       | assessments         | is_correct                     | boolean                     | YES         | null                                            |
| public       | assessments         | feedback                       | text                        | YES         | null                                            |
| public       | assessments         | response_time_ms               | integer                     | YES         | null                                            |
| public       | assessments         | created_at                     | timestamp without time zone | YES         | now()                                           |
| public       | chapters            | id                             | uuid                        | NO          | gen_random_uuid()                               |
| public       | chapters            | textbook_id                    | uuid                        | NO          | null                                            |
| public       | chapters            | chapter_number                 | integer                     | NO          | null                                            |
| public       | chapters            | title                          | text                        | NO          | null                                            |
| public       | chapters            | topics                         | ARRAY                       | YES         | null                                            |
| public       | chapters            | start_page                     | integer                     | YES         | null                                            |
| public       | chapters            | end_page                       | integer                     | YES         | null                                            |
| public       | content_chunks      | id                             | uuid                        | NO          | gen_random_uuid()                               |
| public       | content_chunks      | chapter_id                     | uuid                        | NO          | null                                            |
| public       | content_chunks      | chunk_index                    | integer                     | NO          | null                                            |
| public       | content_chunks      | content                        | text                        | NO          | null                                            |
| public       | content_chunks      | content_type                   | text                        | YES         | null                                            |
| public       | content_chunks      | page_number                    | integer                     | YES         | null                                            |
| public       | content_chunks      | token_count                    | integer                     | YES         | null                                            |
| public       | content_embeddings  | id                             | integer                     | NO          | nextval('content_embeddings_id_seq'::regclass)  |
| public       | content_embeddings  | content_type                   | character varying           | YES         | null                                            |
| public       | content_embeddings  | chapter                        | character varying           | YES         | null                                            |
| public       | content_embeddings  | topic                          | character varying           | YES         | null                                            |
| public       | content_embeddings  | content_text                   | text                        | YES         | null                                            |
| public       | content_embeddings  | embedding                      | USER-DEFINED                | YES         | null                                            |
| public       | content_embeddings  | metadata                       | jsonb                       | YES         | null                                            |
| public       | content_embeddings  | created_at                     | timestamp without time zone | YES         | now()                                           |
| public       | content_sections    | id                             | uuid                        | NO          | gen_random_uuid()                               |
| public       | content_sections    | chapter_id                     | uuid                        | NO          | null                                            |
| public       | content_sections    | section_number                 | numeric                     | YES         | null                                            |
| public       | content_sections    | title                          | character varying           | NO          | null                                            |
| public       | content_sections    | content_type                   | character varying           | NO          | null                                            |
| public       | content_sections    | content_text                   | text                        | NO          | null                                            |
| public       | content_sections    | content_markdown               | text                        | YES         | null                                            |
| public       | content_sections    | latex_equations                | ARRAY                       | YES         | null                                            |
| public       | content_sections    | key_concepts                   | ARRAY                       | YES         | null                                            |
| public       | content_sections    | embedding                      | USER-DEFINED                | YES         | null                                            |
| public       | content_sections    | parent_section_id              | uuid                        | YES         | null                                            |
| public       | content_sections    | section_order                  | integer                     | YES         | 0                                               |
| public       | content_sections    | word_count                     | integer                     | YES         | null                                            |
| public       | content_sections    | estimated_reading_time_minutes | integer                     | YES         | null                                            |
| public       | content_sections    | difficulty_score               | numeric                     | YES         | null                                            |
| public       | content_sections    | created_at                     | timestamp without time zone | YES         | now()                                           |
| public       | content_sections    | updated_at                     | timestamp without time zone | YES         | now()                                           |
| public       | curriculum_data     | id                             | uuid                        | NO          | gen_random_uuid()                               |
| public       | curriculum_data     | grade                          | integer                     | NO          | null                                            |
| public       | curriculum_data     | subject                        | text                        | NO          | null                                            |
| public       | curriculum_data     | topics                         | ARRAY                       | NO          | null                                            |
| public       | curriculum_data     | created_at                     | timestamp with time zone    | YES         | now()                                           |
| public       | flash_card_progress | id                             | integer                     | NO          | nextval('flash_card_progress_id_seq'::regclass) |
| public       | flash_card_progress | session_id                     | uuid                        | YES         | null                                            |
| public       | flash_card_progress | concept                        | character varying           | YES         | null                                            |
| public       | flash_card_progress | difficulty_level               | integer                     | YES         | null                                            |
| public       | flash_card_progress | correct_attempts               | integer                     | YES         | 0                                               |
| public       | flash_card_progress | total_attempts                 | integer                     | YES         | 0                                               |
| public       | flash_card_progress | last_reviewed                  | timestamp without time zone | YES         | now()                                           |
| public       | flash_card_progress | next_review                    | timestamp without time zone | YES         | null                                            |
| public       | flash_card_progress | fsrs_difficulty                | numeric                     | YES         | 0.5                                             |
| public       | flash_card_progress | fsrs_stability                 | numeric                     | YES         | 1.0                                             |
| public       | flash_card_progress | fsrs_retrievability            | numeric                     | YES         | 1.0                                             |
| public       | learning_progress   | id                             | uuid                        | NO          | gen_random_uuid()                               |
| public       | learning_progress   | student_id                     | uuid                        | YES         | null                                            |
| public       | learning_progress   | topic_id                       | text                        | NO          | null                                            |
| public       | learning_progress   | mastery_level                  | integer                     | YES         | 0                                               |
| public       | learning_progress   | attempts                       | integer                     | YES         | 0                                               |
| public       | learning_progress   | time_spent_minutes             | integer                     | YES         | 0                                               |
| public       | learning_progress   | last_attempted                 | timestamp with time zone    | YES         | null                                            |
| public       | learning_progress   | concepts_understood            | ARRAY                       | YES         | null                                            |
| public       | learning_progress   | concepts_struggling            | ARRAY                       | YES         | null                                            |
| public       | learning_progress   | created_at                     | timestamp with time zone    | YES         | now()                                           |
| public       | learning_progress   | updated_at                     | timestamp with time zone    | YES         | now()                                           |
| public       | learning_sessions   | id                             | uuid                        | NO          | gen_random_uuid()                               |
| public       | learning_sessions   | student_id                     | uuid                        | YES         | null                                            |
| public       | learning_sessions   | room_name                      | text                        | NO          | null                                            |
| public       | learning_sessions   | started_at                     | timestamp with time zone    | YES         | now()                                           |
| public       | learning_sessions   | ended_at                       | timestamp with time zone    | YES         | null                                            |
| public       | learning_sessions   | duration_minutes               | integer                     | YES         | null                                            |
| public       | learning_sessions   | topics_discussed               | ARRAY                       | YES         | null                                            |
| public       | learning_sessions   | chapter_focus                  | text                        | YES         | null                                            |
| public       | learning_sessions   | session_summary                | text                        | YES         | null                                            |