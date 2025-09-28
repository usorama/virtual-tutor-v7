-- NABH Manual Database Insertion SQL
-- Generated: 2025-09-28T10:37:51.260765

BEGIN;


-- Insert NABH Textbook
INSERT INTO public.textbooks (
    id, file_name, title, grade, subject,
    total_pages, file_size_mb, status, processed_at
) VALUES (
    '7208beb9-43d9-4577-a063-95437b8f3fa2',
    'Dental-Accreditation-Standards NABH MANUAL.pdf',
    'NABH Dental Accreditation Standards Manual',
    0,
    'Healthcare Administration',
    66,
    0.24,
    'ready',
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    status = EXCLUDED.status,
    processed_at = EXCLUDED.processed_at;


-- Insert Chapters

INSERT INTO public.chapters (
    id, textbook_id, chapter_number, title, topics, start_page, end_page
) VALUES (
    '38bc5470-e940-451b-9193-77064f91f921',
    '7208beb9-43d9-4577-a063-95437b8f3fa2',
    1,
    'Accreditation Standards for Dental',
    ARRAY[],
    1,
    1
);

INSERT INTO public.chapters (
    id, textbook_id, chapter_number, title, topics, start_page, end_page
) VALUES (
    '0c34b689-c043-4af0-bc4f-250e2b3bb1ba',
    '7208beb9-43d9-4577-a063-95437b8f3fa2',
    2,
    'NATIONAL ACCREDITATION BOARD FOR',
    ARRAY[],
    1,
    1
);

INSERT INTO public.chapters (
    id, textbook_id, chapter_number, title, topics, start_page, end_page
) VALUES (
    '8928fbf5-2031-4d0c-90d2-4601144a3fd3',
    '7208beb9-43d9-4577-a063-95437b8f3fa2',
    3,
    'HOSPITALS AND HEALTHCARE PROVIDERS',
    ARRAY[],
    1,
    1
);

INSERT INTO public.chapters (
    id, textbook_id, chapter_number, title, topics, start_page, end_page
) VALUES (
    '3e14a612-86c7-4197-9281-68b1e62ff674',
    '7208beb9-43d9-4577-a063-95437b8f3fa2',
    4,
    'Patient Centered Standards',
    ARRAY[],
    1,
    1
);

INSERT INTO public.chapters (
    id, textbook_id, chapter_number, title, topics, start_page, end_page
) VALUES (
    'd4dcd6f9-c24c-450c-aed4-ecfbcae4c26f',
    '7208beb9-43d9-4577-a063-95437b8f3fa2',
    5,
    '01. Access, Assessment and Continuity of Care (AAC) 03',
    ARRAY[],
    1,
    1
);

INSERT INTO public.chapters (
    id, textbook_id, chapter_number, title, topics, start_page, end_page
) VALUES (
    '0cbe4061-12f7-42ea-b4f0-c4fa10bf2199',
    '7208beb9-43d9-4577-a063-95437b8f3fa2',
    6,
    '02. Care of Patients (COP) 11',
    ARRAY[],
    1,
    1
);

INSERT INTO public.chapters (
    id, textbook_id, chapter_number, title, topics, start_page, end_page
) VALUES (
    '44df4c61-ac9b-4709-aea3-5042b55c2840',
    '7208beb9-43d9-4577-a063-95437b8f3fa2',
    7,
    '03. Management of M edication (MOM) 18',
    ARRAY[],
    2,
    2
);

INSERT INTO public.chapters (
    id, textbook_id, chapter_number, title, topics, start_page, end_page
) VALUES (
    'e2ae77bb-c5e4-4325-9d24-20c7fe8e3746',
    '7208beb9-43d9-4577-a063-95437b8f3fa2',
    8,
    '04. Patient Rights and Education (PRE) 22',
    ARRAY[],
    2,
    2
);

INSERT INTO public.chapters (
    id, textbook_id, chapter_number, title, topics, start_page, end_page
) VALUES (
    'b60aa23e-d6ef-4e21-b717-8354a5808747',
    '7208beb9-43d9-4577-a063-95437b8f3fa2',
    9,
    '05. Hospital Infection Control (HIC)  25',
    ARRAY[],
    2,
    2
);

INSERT INTO public.chapters (
    id, textbook_id, chapter_number, title, topics, start_page, end_page
) VALUES (
    '3e2db1ff-7e96-498a-87a5-ae17f74fe223',
    '7208beb9-43d9-4577-a063-95437b8f3fa2',
    10,
    'Organization Centered Standards',
    ARRAY[],
    2,
    2
);


-- Insert Content Chunks (first 20)

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '1f26a600-068f-4ee0-8e00-386efb2bf6d0',
    '38bc5470-e940-451b-9193-77064f91f921',
    0,
    'Institutions/ Hospitals/ Centres',
    'text',
    8,
    1
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    'a0a6c0e5-6c96-45e1-945c-b5327998c0f1',
    '8928fbf5-2031-4d0c-90d2-4601144a3fd3',
    0,
    'Table of Contents \nSr. No. Particulars Page No. \n Introduction  01',
    'text',
    16,
    1
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    'eece1b24-0054-4cf2-8549-1de3ff631e3e',
    '7833c1ce-aa58-4108-9798-7f9e22618896',
    0,
    'Glossary 51 \n Reference Guide on Sentinel Events  63 \n© National Accreditation Board for Hospitals and Healthcare Providers 1',
    'text',
    31,
    2
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '673d35f7-818a-46b6-9cb9-cedea9e6b334',
    'd036a315-90a3-4b0b-9e85-416535e31088',
    0,
    'Quality is the need of the present time with development of technology and availability of new \nequipment, Dentistry is becoming more and more effective but along with that unsafe. If as \nprofessionals we stick to basic standards we can have safe practices and deliver high quality \ntreatment. Introducing quality management syst ems are very important and the standards help \nus to achieve it.',
    'text',
    98,
    2
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '3e60c4ad-3bb5-46cd-8631-3b7443cafb5a',
    'ab0dd5ad-cbbc-4ba4-80fb-1e72bf43da47',
    0,
    'The NABH standards have been laid down keeping the Indian ethos and working environment \nin mind. The main focus of the standards is on patient, employee, visitor and environment \nsafety. These standards are applicable to multidisciplinary Dental hospitals and single specialty \nhospitals providing secondary, tertiary and quaternary levels of dental care. All the standards \nare core standards and no optional standards have been laid down. . The compliance with \nthese standards will indicate that the hospital is patient, staff and environment friendly.  \nThe standards are deceptively simple. On going through the details during the phase of \nimplementation of the standards one would realiz e that extra efforts and resources are indeed \nrequired for ensuring compliance with the standards. It may also be observed, at the time of \nimplementation, that there may be some duplication at a few places. Duplication is a necessity \nsince it will ensure compliance with the said standards and also emphasize the importance of \nthe standards and the objective elements. \nWe are aware that apart from extra resources needed for implementation, a few guidelines are \nequally necessary for easy comprehension and correct implementation. The ensuing guidelines, \nchapter-wise in tabulated form, have been laid down for easy comprehension, better \nunderstanding of the standards and the objective elements, removing and clarifying ambiguities \nuniform application of standards across the organization, and smoother and more efficient \nimplementation. The best way to implement the standards is to have an in-house quality \ncommittee/team that will be responsible for making the quality manual based on the NABH \nstandards, the initial implementation of the standards and the subsequent monitoring of the \nsame. While there might be initial expenses for ensuring implementation and monitoring of the \nstandards, in the long term these costs will be recovered by the organization owing to the better \nand more efficient and effective quality of patient care. Finally it must also be understood that \naccreditation is an ongoing process. Each time one has to raise the bar and hence the \n© National Accreditation Board for Hospitals and Healthcare Providers 2 \nimportance of continual quality improvement. Accreditation is thus a journey and not a \ndestination. \nDental institution/ hospital/ centre is referred as Dental Facility in this standard.  \n© National Accreditation Board for Hospitals and Healthcare Providers 3 \nCHAPTER-1 Access, Assessment and Continuity of Care (AAC) \nAAC.1. The organization defines and displays the services that it can provide.',
    'text',
    663,
    2
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '745f5786-c723-4f73-a030-657097ade9d3',
    '10c489d9-d5be-49f5-ace3-7705944d11c8',
    0,
    '1.1  The services being provided \nare clearly defined and are \ninconsonance with the needs of \nthe community.\nA policy to be framed clearly stating the services the \ndental facility can provide. \n1.2  The defined services are \nprominently displayed.\nThe services so defined should be displayed \nprominently in an area visible to all patients entering \nthe organization. The display could be in the form of \nboards, citizen’s charter, scrolling messages, etc. \nCare should be taken to ensure that these are \ndisplayed in the language (s) the patient \nunderstands.\n1.3  The staff is oriented to these \nservices\nAll the staff in the dental facility mainly in the \nreception/registration, OPD, IPD is oriented to these \nfacts through training program regularly or through \nmanuals.\nAAC.2.The organization has a well documented registration, admission and transfer or \nreferral process.',
    'text',
    220,
    3
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '5bbb1439-18bd-4651-8d3f-aa9ebb58387b',
    '00fd20eb-5679-4cbc-bad7-5bc958f8bbd2',
    0,
    '2.1 Processes addresses \nregistering and admitting out \npatients, inpatients and \nemergency patients \nDental facility has prepared document (s) detailing \nthe policies and procedures for registration, \nadmission of patient\n2.2  Patients are accepted only if \nthe organization can provide \nthe required service\nThe staff handling admission and registration needs \nto be aware of the services that the organization can \nprovide. It is also advisable to have a system wherein \nthe staff is aware as to whom to contact if they need \nany clarification on the services provided.\n2.3 The policies and procedures \nalso address managing \npatients during  non-availability \nof beds\nThe dental facility is aware of the availability of \nalternate facilities where the patients may be directed \nin case of non-availability of beds.\n2.4  The staff is aware of these \nprocesses \nAll the staff handling these activities should be \noriented to these policies and procedures. \nOrientation can be provided by documentation/ \ntraining.\n© National Accreditation Board for Hospitals and Healthcare Providers 4 \n2.5 Processes addresses \nmechanism for transfer or \nreferral of patient who do not \nmatch the organizational \nresources \nThe documented policy and procedure should \naddress the methodology of safe transfer of the \npatient in a life threatening situation to another dental \nfacility. Availability of an appropriate ambulance fitted \nwith life support facilities and accompanied by trained \npersonnel \nThe dental facility gives a case summary mentioning \nthe significant findings and treatment given in case of \npatients who are being transferred from emergency. \nFor admitted patients a discharge summary has to be \ngiven (refer AAC9).The same shall also be given to \npatients going against medical advice. \nAAC.3. Patients cared for by the organization undergo an established initial assessment',
    'text',
    470,
    4
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '67816adf-03e4-4eff-9ef9-5063b86a8b1e',
    'e9349e7c-bdef-40c1-8234-4dd9dd43dcb0',
    0,
    '3.1  The organization defines the \ncontent of the assessments for \nthe out-patients, in-patients and \nemergency patients.\nThe hospital shall have a protocol/policy by which a \nstandardized initial assessment of patients is done in \nthe OPD, emergency and IPD. The initial assessment \ncould be standardized across the hospital or it could \nbe modified depending on the need of the \ndepartment. However, it shall be the same in that \nparticular area. The organization can have different \nassessment criteria for the first visit and for \nsubsequent visits. In emergency department this \nshall include recording the vital parameters.\n3.2  The organization determines \nwho can perform the \nassessments. \nThe assessment can be done by the treating doctor \nor junior doctor under supervision of treating doctor \nor a dental hygienist under supervision of treating \ndoctor. The organization shall determine who can do \nwhat assessment and it should be the same across \nthe hospital.\n3.3  The organization defines the \ntime frame within which the \ninitial assessment is completed.\nThe dental facility has defined and documented the \ntime frame within which the initial assessment is to \nbe completed with respect to emergency/indoor \npatients. \n3.4  Initial assessment for OPD and \nEmergency cases is done and \ndocumented within a \nreasonable timeframe\nIf required treatment is done  in the  same OPD visit. \nWaiting time is monitored to make it minimum  \n3.5  The initial assessment for in-\npatients is documented within \n24 hours or earlier as per the \npatient’s condition or hospital \npolicy.\nThe facility’s documented protocol mentions that the \ninitial assessment is to be completed within 24 hours \nor earlier depending upon the patient’s condition. \nThis should also cover history, progress notes, \ninvestigation ordered and treatment ordered and all \nthese are to be authenticated by treating doctor.\n© National Accreditation Board for Hospitals and Healthcare Providers 5 \n3.6  The initial assessment results \nin a documented plan of care \nand includes preventive aspect \nof the care.\nThis shall be documented by the treating \ndoctor/dental surgeon or by a member of his team in \nthe case sheet.  \nThe documented plan of care should cover \npreventive actions as necessary in the case and \nshould include diet, drugs, etc.\nAAC.4. patients care is a continuous process and all patient care for by the organization \nundergo a regular reassessment',
    'text',
    610,
    5
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    'ccbdaca7-c4cd-4e3b-8540-07294d1f3dde',
    '23d23470-e6a0-4243-b0d2-22e7f5023a0e',
    0,
    '4.1 During all phases of care, there \nis a qualified individual \nresponsible for the patient care \nwho co-ordinates the care in all \nthe setting with-in the \norganization \nThe facility to ensure that the care of patients is \nalways given by appropriately qualified dental \npersonnel (resident doctor, surgeon, consultant \nand/or nurse). \nCare of patients is coordinated among various care \nproviders in a given setting viz OPD, emergency, IP \netc. The organization shall ensure that there is \neffective communication of patient requirements \namongst the care providers in all settings. \n4.2  All patients are reassessed at \nappropriate intervals.\nAfter the initial assessment, the patient is reassessed \nperiodically and this is documented in the case sheet. \nThe frequency may be different for different areas \nbased on the setting and the patient''s condition.\n4.3  Staff involved in direct clinical \ncare documents \nreassessments\nActions taken under reassessment are documented. \nThe staff could be the treating doctor or any member \nof the team. The nursing staff and trained dental \nhygienist where available can document patient’s \nvitals.\n4.4  Patients are reassessed to \ndetermine their response to \ntreatment and to plan further \ntreatment or discharge.\nSelf explanatory \n© National Accreditation Board for Hospitals and Healthcare Providers 6 \nAAC.5. Clinical Laboratory services are provided as per the requirements of the patients',
    'text',
    360,
    7
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '05a1d9be-77b5-40ec-a199-e7b37c83eec3',
    '45b9c096-e691-4fcd-bf44-f224d7f781f3',
    0,
    '5.1  Scope of the laboratory \nservices are commensurate to \nthe services provided by the \norganization.\nThe facility should ensure availability of laboratory \nservices commensurate with the health care services \noffered by it. See also (5.5) below for outsourced lab \nfacilities.\n5.2  Adequately qualified and \ntrained personnel perform \nand/or supervise the \ninvestigations.\nThe staff employed in the lab should be suitably \nqualified (appropriate degree) and trained to carry out \nthe tests under supervision of specialist.\n5.3  Policies and procedures guide \ncollection, identification, \nhandling, safe transportation \nand disposal of specimens.\nThe facility has documented procedures for \ncollection, identification, handling, safe \ntransportation, processing and disposal of \nspecimens, to ensure safety of the specimen till the \ntests and retests (if required) are completed.\n 5.4  Laboratory results are available \nwithin a defined time frame. \nCritical results are intimated \nimmediately to the concerned \npersonnel\nThe facility shall define the turnaround time for all \ntests. The facility should ensure availability of \nadequate staff, materials and equipment to make the \nlaboratory results available within the defined time \nframe. \n5.5  Laboratory tests not available \nin the organization are \noutsourced to organization(s) \nbased on their quality \nassurance system.\nThe facility has documented procedure for \noutsourcing tests for which it has no facilities. This \nshould include: a) list of tests for outsourcing b) \nidentity of personnel in the outsourced facilities to \nensure safe transportation of specimens and \ncompleting of tests as per requirements of the patient \nconcerned and receipt of results at facility c) manner \nof packaging of the specimens and their labeling for \nidentification and this package should contain the test \nrequisition with all details as required for testing. A \nmethodology to check the performance of service \nrendered by the outsourced laboratory as per the \nrequirements of the facility.\n5.6  Quality assurance for \nlaboratory should be as per \naccepted practices and also \ninclude periodic calibration and \nmaintenance of all the \nequipments. \nThe facility has a documented quality assurance \nprogram. The laboratory in-charge shall periodically \nsurvey tests results. The program includes the \ndocumentation of corrected and preventive action. \n© National Accreditation Board for Hospitals and Healthcare Providers 7 \nAAC.6. There is an established laboratory safety program.',
    'text',
    632,
    9
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '9f868ef5-0772-420c-9240-069a889a84eb',
    '45b22429-f212-4cd3-8755-2300833c0be5',
    0,
    '6.1  The laboratory safety program \nis documented. \nA well documented lab safety manual is available in \nthe lab. This takes care of the safety of the workforce \nas well as the equipment available in the lab. \n6.2  This program is integrated with \nthe organization’s safety \nprogram \nLab safety program is incorporated in the safety \nprogram of the hospital. \n6.3  Written policies and procedures \nguide the handling and disposal \nof infectious and hazardous \nmaterials.\nThe lab staff should follow standard precautions .The \ndisposal of waste is according to biomedical handling \nand management rules, 1998.\n6.4  Laboratory personnel are \nappropriately trained in safe \npractice are   provided with \nappropriate safety \nequipment/devices\nAll the lab staff undergoes training regarding safe \npractices in the lab. Adequate safety devices are \navailable in the lab e.g. fire extinguishers, dressing \nmaterials, standard precautions, disinfectants, etc \nAAC.7. Imaging services are provided as per the requirements of the patients',
    'text',
    257,
    11
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    'dc9e7f6a-9929-4318-8203-2ff1d395bd8a',
    'b3609cc8-16fa-4a2c-8290-b3cfdd238e23',
    0,
    '7.1  Imaging services comply with legal \nand other requirements\nThe facility is aware of the legal and other \nrequirements of imaging services and the same \nare documented for information and compliance \nby all concerned in the facility. The facility \nmaintains and updates its compliance status of \nlegal and other requirements in a regular manner.\n7.2  Scope of the imaging services are \ncommensurate to the services \nprovided by the organization.\nSelf explanatory \n7.3  Adequately qualified and trained \npersonnel perform and/or \nsupervise the investigations.\nAs per AERB guidelines \n7.4  Policies and procedures guide \nidentification and safe \ntransportation of patients to \nimaging services.\nThe facility has documented policies and \nprocedures for informing the patients about the \nimaging activities, their identification and safe \ntransportation to the imaging services. This should \nalso address transfer of unstable patients to \nimaging services.\n© National Accreditation Board for Hospitals and Healthcare Providers 8 \n7.5  Imaging results are available \nwithin a defined time frame. \nCritical results are intimated \nimmediately to the concerned \npersonnel \nThe organization shall document turnaround time \nof imaging results.\nCritical results are intimated immediately to the \nconcerned personnel \n7.6  Imaging tests not available in the \norganization are outsourced to \norganization(s) based on their \nquality assurance system.\nThe facility has documented procedure for \noutsourcing tests for which it has no facilities. This \nshould include: a) list of tests for outsourcing b) \nidentity of personnel in the outsourced facilities to \nensure safe transportation of specimens and \ncompleting of imaging tests, c) the manner of \nidentification of patients and the test requisition \nwith all details as required for testing and d) a \nmethodology to check the selection and \nperformance of service rendered by the \noutsourced imaging facility as per the \nrequirements of the facility.\n7.7 Quality assurance for radiology \nservices should be as per \naccepted practices and also \ninclude periodic calibration and \nmaintenance of all equipments \nRefer to AERB guidelines. \nDocuments for verification and validation of \nimaging methods shall be available. \nHOD shall periodically survey the imaging results. \nCalibration and maintenance of all equipment \nshall be carried out by competent persons. \n7.8 Imaging personnel are trained in \nradiation safety and are provided \nwith appropriate safety equipment \ndevices \nRefer to AERB guidelines \nThe safety program of the imaging department \nhas reference in the hospital safety manual. \nProtective devices e.g. lead aprons should be \nexposed to X-ray for verification of cracks and \ndamages. \n7.9 Imaging  signage are prominently \ndisplayed in all appropriate \nlocations \nSelf explanatory \n© National Accreditation Board for Hospitals and Healthcare Providers 9 \nAAC.8. The organization has a documented process for generating and maintains OPD \nrecords of patient care',
    'text',
    755,
    11
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '38f985d7-ce34-44fc-ad81-363fae8ca8b9',
    'b4eddef9-77b4-4368-bbca-7cbb627d9430',
    0,
    '8.1  Policy and procedures are in \nplace to maintain OPD records \nof patient care\nFacility devise OPD   dental records which has \npatient card and   institutional OPD folder. Patient \ncard contains OPD registration number, diagnosis, \nprocedure done, treatment prescribed, advice given \nand appointment.  Institutional OPD folder contains \nhistory, examination, diagnosis investigations, \nprocedures done, treatment prescribed and \nappointment.     \n8.2  The record contains the \ndiagnosis and plan of treatment\n8.3  The record contains \ninvestigations ordered and the \nresults thereof. \n8.4  The record contains the \ntreatment received and \nprocedures conducted on the \npatient\n8.5 Patients take home OPD \nCard/slip contains procedural \nsummary, medications, \ninstruction and follow up \nappointment. \nOrganization defines the time \nframe for which these records \nare retained \nThe organization decides the contents of the \nProcedural Summary \nAAC.9. The organization has a documented discharge process and contents of discharge \nsummary',
    'text',
    259,
    14
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '0f670cee-65f5-4925-b20e-45c40e2f6c5b',
    'ab7b79dc-feed-48e4-b463-28800b5f3555',
    0,
    '9.1  Process addresses discharge \nof all patients including medico-\nlegal patients leaving against \nmedical advice \nSelf explanatory \n9.2  A discharge summary is given \nto all the patients leaving the \norganization (including patients \nleaving against medical advice) \nThe facility hands over the discharge papers to the \npatient/attendant in all cases and copy retained. In \nLAMA cases, the declaration of the patient/attendant \nis to be recorded on proper format \n© National Accreditation Board for Hospitals and Healthcare Providers 10 \n9.3  Discharge summary contains \nthe reasons for admission, \nsignificant findings and \ndiagnosis, investigation results, \nprocedure performed treatment \ngiven and the patient’s \ncondition at the time of \ndischarge. \nSelf explanatory \n9.4  Discharge summary contains \nfollow-up advice medications \nfollow up instructions in an \nunderstandable manner \nSelf explanatory \n9.5  Discharge summary \nincorporates instructions about \nwhen and how to obtain urgent \ncare \nSelf explanatory \n9.6  In case of death the summary \nof the case also includes the \ncause of death \n© National Accreditation Board for Hospitals and Healthcare Providers 11 \nChapter 2. Care of Patients  \nCOP.1. Uniform care of patients is provided in all settings of the organization and is \nguided by the applicable laws, regulations and guidelines.',
    'text',
    338,
    15
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '43290a9e-8b97-4e50-9087-1cfd8b2bd0d7',
    'ff9e09fb-70ca-4bbc-a3ca-58e8c64d80a8',
    0,
    '1.1 Care delivery is uniform when \nsimilar care is provided in more \nthan one setting \nThe organization shall ensure that patients with the \nsame health problems and care needs receive the \nsame quality of healthcare throughout the \norganization irrespective of the category of ward. \n1.2 Uniform care is guided by \npolicies and procedures which \nreflect applicable laws and \nregulations \nSelf explanatory \n1.3 The care and treatment orders \nare signed, named, timed and \ndated by the concerned doctor \nand countersigned by \nconsultant I/C of case \nThe treatment of patient could be initiated by a junior \ndental surgeon or student trainee but same should be \ncountersigned and authorized by the treating \nconsultant of the case within 24 hours. \n1.4 Evidence based dentistry and \nacceptable clinical practice \nguidelines are adopted to guide \npatient care whenever possible \nThe organization could develop clinical protocols \nbased on these and the same could be followed in \nmanagement of patients.   \nCOP.2. Emergency services are guided by policies, procedures, applicable laws and \nregulations',
    'text',
    274,
    16
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    'cd46c9a4-9d86-41c4-9666-def1c5411ec5',
    '9ea77172-66ef-4d9d-80b1-b8478ecd3226',
    0,
    '2.1 Documented procedure \naddresses care of patient \narriving in  emergency including \nthe medico-legal cases\nThese could include SOPs/protocols to provide either \ngeneral emergency care or management of specific \nconditions The policy shall be in line with statutory \nrequirements\n2.2  Policies and procedures guide \nthe triage of patients for \ninitiation of appropriate care\n2.3  Staff is familiar with the policies \nand trained on the procedures \nfor care of emergency patients\nAll the staff working in the dental casualty where \nfunctioning should be oriented to the policies and \npractices through training/documents. Staff should \npreferably be trained/well versed in ACLS and BCLS\n2.4  Admission or discharge to home \nor transfer to another \norganization is also \ndocumented\nAll the staff working in the dental casualty where \nfunctioning should be oriented to the policies and \npractices through training/documents. Staff should \npreferably be trained/well versed in ACLS and BCLS.\n© National Accreditation Board for Hospitals and Healthcare Providers 12 \n2.5  The ambulance is appropriately \nequipped and manned by \ntrained personnel \nAmbulance should have at least equipment for basic \nlife support and manned by a trained driver. \n2.6  In the ambulance, there is a \ncheck-list of all equipments and \nemergency medications on \nregular basis \nCOP.3. Policies and procedures guide the care of patients requiring cardio-pulmonary \nresuscitation',
    'text',
    362,
    17
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    'df7ae00d-9b93-4324-b16b-261258f7fbdd',
    '34f85156-cbcc-4dfc-a9b1-800912a4464b',
    0,
    '3.1  Documented procedures guide \nthe uniform use of resuscitation \nthroughout the organization\nThe organization shall document the procedure for the \nsame. This shall be in consonance with accepted \npractices. \n3.2  Staff  providing direct patient \ncare is trained and periodically \nupdated in cardio-pulmonary \nresuscitation\nThese aspects shall be covered by hands-on training. \nIf the organization has a CPR team (e.g. code blue \nteam) it shall ensure that they are all trained in ALS \nand are present in all shifts.\n3.3  The events during a cardio-\npulmonary resuscitation are \nrecorded\nIn the actual event of a CPR or a mock drill of the \nsame, all the activities along with the personnel \nattended should be recorded. \nCOP.4 Policies and procedures define rational use of blood and blood products',
    'text',
    200,
    18
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '24cbd20d-0993-4f7f-95e3-9e2cddde1442',
    'dddf673b-6a88-4669-8113-809a3147d00a',
    0,
    '4.1  Documented policies and \nprocedures are used to guide \nrational use of blood and blood \nproducts\nThis shall address the conditions where blood and \nblood products can be used.\n4.2  Informed consent is obtained for \ntransfusion of blood and blood \nproducts\nSelf explanatory. Also refer to PRE3.4 and 3.5. \n4.3  Procedure addresses \ndocumenting and reporting of \nTransfusion reaction.\nThe organization shall ensure that any transfusion \nreaction is reported. These are then analyzed (by \nindividual/committee as decided by the organization) \nand appropriate corrective/preventive action is taken. \nThe organization shall maintain a record of \ntransfusion reactions.\n© National Accreditation Board for Hospitals and Healthcare Providers 13 \nCOP.5. Policies and procedures guide the dental laboratory services',
    'text',
    202,
    19
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '64832a3b-3b0c-48af-8f1a-f317612df72f',
    '2bdf4e82-06fa-42d2-949b-edbf870aa2f4',
    0,
    '5.1  The scope of the dental \nlaboratory services are \ncommensurate to the services \nprovided by the hospital \nDental facility should ensure availability dental lab \nfacilities commensurate with the services offered by it. \nSee (5.7) also for the outsourced Lab facilities. \n5.2  Adequately qualified and trained \npersonnel perform and \nsupervise the work \n5.3  Policies and Procedures guide \nthe identification, disinfection \nhandling, processing, safe \ntransportation of the models \nand prosthesis as well as safe \ndisposal of the waste \nThe impressions and models need to be disinfected \nproperly \n The model should be accompanied by a properly \ncompleted authorization form duly signed by treating \ndental surgeon/ dental specialist.  \n5.4  All models and prosthesis are \navailable within a defined time \nframe. \n5.5  Quality assurance for dental lab \nshould be as per accepted \npractices and also includes \nperiodic calibration and \nmaintenance of all equipments \n5.6  Corrections and alterations are \nattended to through a structured \nand time based programme. \n5.7  Lab jobs not available in the \norganisation are out sourced to \norganisations based on their \nquality assurance programme \n5.8  Lab has a documented safety \nprogramme which is integrated \nwith the organisations safety \nprogram.  All personnel are \ntrained  in lab safety and are \nprovided safety  equipment and \ndevices \nA well documented dental Lab safety manual is \navailable which take care of all staff as well all \nequipment available in the Lab. This could be as per \nOccupational health & Safety Management System-\nOSHAS 1800.  \n© National Accreditation Board for Hospitals and Healthcare Providers 14 \nCOP.6. Policies and procedures guide the care of vulnerable patients (elderly, children, \nphysically and/or mentally challenged)',
    'text',
    452,
    20
);

INSERT INTO public.content_chunks (
    id, chapter_id, chunk_index, content, content_type, token_count, page_number
) VALUES (
    '47027301-df81-497f-bf04-40bdc82f6780',
    'a17d8dd3-f175-4592-9b6f-0c20bb708fbb',
    0,
    '6.1  Policies and procedures are \ndocumented and are in \naccordance with the prevailing \nlaws and the national and \ninternational guidelines\nSelf explanatory.  \n6.2  Care is organized and delivered \nin accordance with the policies \nand procedures\nFacility develops SOP''s for delivery of care. \n6.3  The organization provides for a \nsafe and secure environment \nfor this vulnerable group\nThe organization shall provide proper environment \ntaking into account the requirement of the vulnerable \ngroup \nCOP.7. Policies and procedures guide the care of pediatric dental patients',
    'text',
    143,
    22
);


COMMIT;
