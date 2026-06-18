/**
 * Senior Secondary Curriculum Data (Grade 10-12)
 * Based on KICD Senior School Curriculum Designs (July 2025)
 */

export interface SeniorSubStrand {
  name: string;
  learningOutcomes: string[];
}

export interface SeniorStrand {
  name: string;
  subStrands: SeniorSubStrand[];
}

export interface SeniorSubjectCurriculum {
  grade: string;
  subject: string;
  strands: SeniorStrand[];
}

// Grade 10 Agriculture Curriculum — KICD 2025
export const grade10AgricultureCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 10',
  subject: 'Agriculture',
  strands: [
    {
      name: '1.0 Crop Production',
      subStrands: [
        {
          name: '1.1 Agricultural Land',
          learningOutcomes: [
            'Discuss legal ways of accessing and owning land for agricultural use (leasing, inheritance/succession, settlement programmes, allocation by the government, land adjudication, purchase/transfer, and donation)',
            'Study and assess different forms of land and their possible utilities for agricultural purposes',
            'Use digital devices to search for information on natural factors that determine the productivity of land (climate, altitude, soil factors, topography, biotic factors)',
            'Appreciate the different forms of land and importance of land ownership security in agricultural production'
          ]
        },
        {
          name: '1.2 Properties of Soil',
          learningOutcomes: [
            'Discuss components of soil (mineral particles, organic matter, water, and air) and their importance in crop production',
            'Carry out simple experiments using soil samples to examine the various components of soil',
            'Investigate selected properties of soil that influence crop production (soil texture, soil structure, porosity, permeability, soil pH, living organisms)',
            'Carry out experiments to test properties of soil (soil texture, water holding capacity, soil capillarity, and soil pH)',
            'Take field excursion to observe soil profile and discuss its importance in crop production'
          ]
        },
        {
          name: '1.3 Land Preparation',
          learningOutcomes: [
            'Describe activities of fallow land preparation to appropriate seedbed (land clearing, primary cultivation, secondary cultivation, tertiary operations)',
            'Justify use of conservation tillage practices (zero tillage, minimum tillage) in crop production',
            'Carry out land preparation operations for a selected crop',
            'Appreciate the importance of land preparation in crop production'
          ]
        },
        {
          name: '1.4 Field Management Practices',
          learningOutcomes: [
            'Describe management practices of selected vegetable and perennial crops',
            'Carry out selected management practices in crop production (pruning of vegetables such as capsicum, tomatoes, and perennial crops such as bananas, pyrethrum, coffee, tea)',
            'Explain factors considered in top-dressing a crop field (proper timing, type and form of fertiliser, top-dressing method, correct amount)',
            'Explore methods of top-dressing fertilisers (broadcasting, side dressing, foliar application)',
            'Appreciate the importance of selected management practices in crop production'
          ]
        },
        {
          name: '1.5 Growing Selected Crops',
          learningOutcomes: [
            'Determine appropriate crops established from the nursery',
            'Grow a selected crop by raising it from a nursery bed, transplant to the seedbed and carry out appropriate management practices during its growth cycle',
            'Justify management practices for a selected crop',
            'Discuss and make class presentations on why field management practices are carried out on a selected crop'
          ]
        },
        {
          name: '1.6 Crop Protection: Weed Control',
          learningOutcomes: [
            'Identify weeds in a crop field and make herbarium on identified weeds',
            'Classify weeds based on morphology and growth cycle using digital and non-digital resources',
            'Examine various methods of weed control (physical/mechanical, cultural, biological, chemical, legislative)',
            'Carry out weed control in a crop field using appropriate methods (physical, cultural, biological, chemical, integrated methods)',
            'Appreciate the economic importance of weeds to a farming household'
          ]
        },
        {
          name: '1.7 General Crop Harvesting',
          learningOutcomes: [
            'Explain factors that determine the harvesting of a crop produce (harvest timing, stage of growth, purpose)',
            'Discuss the harvesting process (pre-harvest practices, harvesting, post-harvest practices) for tuber and cereal crops',
            'Carry out the harvesting processes for selected crop produce',
            'Acknowledge the importance of harvesting processes in crop production'
          ]
        }
      ]
    },
    {
      name: '2.0 Animal Production',
      subStrands: [
        {
          name: '2.1 Breeds of Livestock',
          learningOutcomes: [
            'Distinguish common breeds of livestock (cattle, pigs, rabbits, sheep, goats) based on their characteristics',
            'Analyse the contribution of animal production to the economy',
            'Appreciate the diversity of productivity from different livestock breeds',
            'Use field observations, digital and print resources to describe characteristic features of breeds'
          ]
        },
        {
          name: '2.2 Safe Handling of Animals',
          learningOutcomes: [
            'Discuss inhumane treatment of livestock (poor restraining, inappropriate castration, poor transport methods, overloading draught animals)',
            'Describe structures used to ensure safety in handling domestic animals (crush pens, holding yards, raceways, farrowing crates, milking stalls, squeeze chutes)',
            'Exhibit ways of ensuring safety of persons handling domestic animals (appropriate restraining methods, correct positioning, holding appropriate parts, safe distance)',
            'Promote the safe handling of domestic animals in the community'
          ]
        },
        {
          name: '2.3 General Animal Health',
          learningOutcomes: [
            'Explain the benefits of keeping animals healthy in livestock production',
            'Compare signs of ill health and normal health in livestock production',
            'Propose general preventative and control measures against ill health in livestock production',
            'Adopt practices that maintain animal health in livestock production',
            'Discuss why notifiable diseases should be reported to the relevant government authority and why quarantine measures should be enforced'
          ]
        },
        {
          name: '2.4 Beekeeping',
          learningOutcomes: [
            'Explain the factors to consider in siting an apiary (near water and nectar sources, shaded place, away from roads, humans and livestock)',
            'Describe types of hives used in beekeeping (traditional hive, Kenya top bar hive, Langstroth hive)',
            'Describe the process of stocking a hive',
            'Carry out safe apiary management practices',
            'Examine causes of unexpected behaviours of bees (swarming, absconding, migration)',
            'Simulate or role-play honey harvesting process from a bee hive',
            'Appreciate the importance of beekeeping in the economy'
          ]
        },
        {
          name: '2.5 Animal Rearing Project',
          learningOutcomes: [
            'Adopt a project template to write a project plan on rearing a selected animal (birds or insects)',
            'Prepare a budget for the animal-rearing project',
            'Discuss appropriate animal-rearing practices',
            'Implement the plan for the animal-rearing project',
            'Carry out routine management practices in an animal-rearing project',
            'Evaluate the animal rearing practices carried out in the project'
          ]
        }
      ]
    },
    {
      name: '3.0 Agricultural Technologies and Entrepreneurship',
      subStrands: [
        {
          name: '3.1 Tools and Equipment',
          learningOutcomes: [
            'Identify tools and equipment used for various agricultural tasks (gardening, livestock production, assembling and dissembling)',
            'Carry out various agricultural tasks using appropriate tools and equipment',
            'Carry out appropriate maintenance practices on selected tools and equipment (cleaning, sharpening, lubrication, part repairs and replacements, parts tightening, painting)',
            'Apply safety measures in the use of tools and equipment (appropriate storage, correct usage, safe distance, appropriate PPE)',
            'Acknowledge the importance of maintaining tools and equipment'
          ]
        },
        {
          name: '3.2 Product Processing and Value Addition',
          learningOutcomes: [
            'Suggest methods of value addition for selected crop produce',
            'Carry out processing of selected crop produce',
            'Carry out home-based packaging and branding of processed crop products',
            'Appraise ethical issues in the processing and value-addition processes'
          ]
        },
        {
          name: '3.3 Establishing Agricultural Enterprise',
          learningOutcomes: [
            'Discuss the factors of production (land/space, labour, entrepreneurship, capital) in an agricultural enterprise',
            'Discuss alternative ways of acquiring capital to establish an agricultural enterprise (borrowing, savings, disposing assets, grants, donations)',
            'Examine factors to consider in selecting an agricultural enterprise (physical infrastructure, inputs, labour requirements, skill requirement, production techniques, legal requirements, market)',
            'Appreciate the role of various factors of production in establishing an agricultural enterprise'
          ]
        },
        {
          name: '3.4 Marketing Agricultural Produce',
          learningOutcomes: [
            'Describe ways of preparing agricultural produce for marketing (weighing, sorting, grading, packaging, branding, labelling)',
            'Prepare agricultural produce for marketing',
            'Discuss market outlets for agricultural produce (digital platforms and physical market outlets)',
            'Evaluate expenses incurred in marketing agricultural produce (transportation costs, advertisement costs, market authority charges, taxes)',
            'Appreciate the importance of preparing agricultural produce for marketing'
          ]
        },
        {
          name: '3.5 Composting Techniques',
          learningOutcomes: [
            'Describe methods of composting (conventional methods, innovative methods) using locally available resources',
            'Examine factors that influence the quality of compost manure (materials used, process of composting, storage conditions)',
            'Carry out conventional composting methods for the production of organic manure',
            'Carry out innovative composting methods (vermicomposting, containerised composting, four-pit method)',
            'Appreciate the role of composting in soil improvement'
          ]
        }
      ]
    }
  ]
};

// Grade 10 Chemistry Curriculum — KICD 2025
export const grade10ChemistryCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 10',
  subject: 'Chemistry',
  strands: [
    {
      name: '1.0 Inorganic Chemistry',
      subStrands: [
        {
          name: '1.1 Introduction to Chemistry',
          learningOutcomes: [
            'Explain the meaning of Chemistry as a field of science',
            'Explore the role of Chemistry in day-to-day life',
            'Discuss branches of Chemistry and their importance in daily lives',
            'Examine the effects of drug and substance use in day-to-day life',
            'Search for information on career opportunities related to Chemistry and how gender stereotyping influences career choices',
            'Discuss the meaning of drug, prescription, dosage and substance use',
            'Advocate for a safe and healthy learning environment'
          ]
        },
        {
          name: '1.2 The Atom',
          learningOutcomes: [
            'Review the concept of the structure of the atom, atomic number and mass number',
            'Discuss the relationship between atomic number, mass number and number of electrons in an atom',
            'Illustrate the structure of the atom using Dalton, Rutherford\'s and Bohr models',
            'Brainstorm the meaning of the terms isotopes and relative atomic mass',
            'Calculate the relative atomic mass of elements from isotopic abundances',
            'Discuss the relationship between energy levels and orbitals in an atom',
            'Carry out simple activities to illustrate the order of filling electrons in orbitals',
            'Draw the electron arrangement for the first 20 elements using s and p orbitals',
            'Watch simulation on the Rutherford Gold Foil experiment and discuss with peers'
          ]
        },
        {
          name: '1.3 The Periodic Table',
          learningOutcomes: [
            'Brainstorm on the historical development of the periodic table',
            'Arrange the first 20 elements of the periodic table into groups and periods',
            'Identify the chemical families of elements in the periodic table (alkali metals, alkaline earth metals, halogens, noble gases, transition elements)',
            'Discuss the stability of atoms (loss or gain of electrons)',
            'Predict the type of ion formed from a given electron arrangement of an atom',
            'Write electron arrangement of ions using s and p notation',
            'Infer the valency and oxidation numbers from electron arrangement of elements',
            'Discuss elements with variable oxidation numbers',
            'Practise writing formulae of compounds using valencies and oxidation states of elements and radicals',
            'Write balanced chemical equations for simple chemical reactions'
          ]
        },
        {
          name: '1.4 Chemical Bonding',
          learningOutcomes: [
            'Review the concept of stability of atoms (gaining and/or losing electrons)',
            'Discuss the role of valence electrons in bonding (octet/duplet noble gas configuration)',
            'Discuss different types of chemical bonds (ionic, covalent, dative covalent, hydrogen bond, Van der Waals and metallic)',
            'Draw Lewis structures dot (.) and/or cross (x) diagrams to show bonding in selected elements, molecules and compounds',
            'Carry out activities to investigate physical properties of giant ionic, simple molecular, giant atomic/covalent and giant metallic compounds (solubility, thermal and electrical conductivity, melting point, boiling point)',
            'Relate bond types to the uses of elements, molecules and compounds',
            'Model bonding in selected molecules and compounds using locally available materials (e.g. NaCl, SiO₂, graphite, diamond)',
            'Appreciate the uses of different substances based on their bond types and structures in day-to-day life'
          ]
        },
        {
          name: '1.5 Periodicity',
          learningOutcomes: [
            'Discuss trends in physical properties of chemical elements in group I, II, VII and VIII',
            'Carry out experiments to investigate physical properties of group I and II elements',
            'Carry out experiments to investigate chemical properties of group I and II elements (reaction with oxygen, chlorine, cold water, steam and dilute acids)',
            'Investigate physical properties of chlorine, bromine and iodine (appearance, smell, solubility in water and physical states)',
            'Carry out experiments to investigate chemical properties of chlorine (reaction with water, metals, displacement reactions and bleaching action)',
            'Discuss trends in physical properties of period three elements (atomic size, ionisation energy, electron affinity, electronegativity, melting and boiling points)',
            'Carry out experiments on reactions of period three elements with oxygen, water, chlorine and dilute acids',
            'Search for information on the uses of selected elements in groups I, II, VII and VIII',
            'Describe trends in properties across a period',
            'Outline applications of elements of the periodic table'
          ]
        }
      ]
    },
    {
      name: '2.0 Physical Chemistry',
      subStrands: [
        {
          name: '2.1 Acids and Bases',
          learningOutcomes: [
            'Carry out experiments to demonstrate dissociation of acids and bases in water',
            'Carry out experiments on chemical properties of acids (reactions with metals, carbonates, hydrogen carbonates, metal oxides and hydroxides)',
            'Perform experiments to investigate reactions of acids and bases with metal oxides and hydroxides',
            'Collect and test for gases produced during the reactions',
            'Conduct experiments to determine strength of acids and bases using acid-base indicator',
            'Carry out activities to compare the electrical conductivity of strong and weak acids and bases using pH scale',
            'Search for information on applications of acids and bases',
            'Observe safety when handling acids and bases',
            'Appreciate the uses of acids and bases in day-to-day life'
          ]
        },
        {
          name: '2.2 Introduction to Salts',
          learningOutcomes: [
            'Brainstorm and carry out activities to establish the meaning of salt',
            'Classify different salts based on their composition (chlorides, carbonates, nitrates and sulphates)',
            'Prepare salts using appropriate methods in the laboratory (direct synthesis, reactions between acids and metals, acids and bases, acids and carbonates/hydrogen carbonates, precipitation reaction)',
            'Carry out experiments to determine the solubility of salts in water and classify them as soluble or insoluble',
            'Carry out experiments to investigate the behaviour of different salts when exposed to the atmosphere (hygroscopic, deliquescent and efflorescent salts)',
            'Write balanced chemical equations for reactions involved in the preparation of salts (ionic equations)',
            'Discuss the applications of salts in day-to-day life (agriculture, food industry, medicine, paper industry, paints industry)',
            'Search for information on the effects of applications of salts (inorganic fertilisers) on environmental sustainability (water pollution-eutrophication, soil and air pollution)',
            'Discuss mitigation measures to challenges of using inorganic fertilisers for sustainable economy'
          ]
        }
      ]
    },
    {
      name: '3.0 Organic Chemistry',
      subStrands: [
        {
          name: '3.1 Introduction to Organic Chemistry',
          learningOutcomes: [
            'Explain what organic compounds are and distinguish them from inorganic compounds',
            'Describe carbon as a unique element and its bonding (single, double, triple, chains and rings)',
            'Represent simple organic molecules using dot-and-cross diagrams, structural formulae and models',
            'Identify introductory functional groups (–OH, –COOH, C=C, –NH₂) in selected compounds',
            'Relate organic compounds to everyday Kenyan products (soaps, fuels, plastics, medicines, food) and safe handling of household chemicals',
            'Discuss environmental issues related to organic products (plastic waste, emissions)'
          ]
        },
        {
          name: '3.2 Hydrocarbons and Fuels',
          learningOutcomes: [
            'Classify hydrocarbons at introductory level into alkanes and alkenes',
            'Relate hydrocarbon structure (single vs double bonds, chain length) to physical properties',
            'Describe complete and incomplete combustion of hydrocarbons qualitatively, including word and balanced equations',
            'Discuss fuels in daily Kenyan life (petrol, diesel, kerosene, LPG, biogas, charcoal) and their environmental impact (soot, CO, CO₂, global warming)',
            'Propose safe and sustainable practices in fuel use (ventilation, fire safety, switching to cleaner fuels)'
          ]
        }
      ]
    }
  ]
};

// Grade 10 Biology Curriculum — KICD 2025
export const grade10BiologyCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 10',
  subject: 'Biology',
  strands: [
    {
      name: '1.0 Cell Biology and Biodiversity',
      subStrands: [
        {
          name: '1.1 Introduction to Biology',
          learningOutcomes: [
            'Search for information on the meaning and application of Biology in everyday life and share with peers',
            'Collaboratively search for information from print and non-print media on fields of study in Biology (Botany, Zoology, Taxonomy, Anatomy, Physiology, Ecology, Biochemistry, Biotechnology, Genetics, Parasitology, Microbiology, Entomology) and relate them to career opportunities',
            'Use locally available materials to design a career wheel to relate fields of study in Biology',
            'Discuss the factors that influence career choices (interest, ability) and those that should not (gender, culture, disability, environment and stereotypes)',
            'Interact with resource persons whose careers are related to Biology to reinforce on factors that should not influence career choices',
          ]
        },
        {
          name: '1.2 Specimen Collection and Preservation',
          learningOutcomes: [
            'Search for information on apparatus and materials for collecting specimens (pooter/aspirator, pitfall trap, soapy water, pair of forceps, sweep net/aerial net, light traps, Tullgren funnel, envelopes for butterflies)',
            'Improvise apparatus from locally available materials and use them for collecting, processing and preserving specimens',
            'Collect small animals using appropriate apparatus and identify them',
            'Search for information on preservatives used in preservation of specimens and discuss with peers',
            'Process and preserve animal specimens (sorting, mounting on soft boards, ethanol/wet preservation, labelling)',
            'Make a herbarium to preserve specimens (pressing, drying, mounting, labelling to include common/local name)',
            'Carry out a project on collecting, processing and preserving biological specimens including discussion on financial literacy components (planning, budgeting, specimen collection, recording)',
          ]
        },
        {
          name: '1.3 Cell Structure and Specialisation',
          learningOutcomes: [
            'Search for information on structural and functional differences between light and electron microscope (resolution and magnification)',
            'Carry out experiments on the procedures in preparation of specimen slides for observation on a light microscope (sectioning, staining, mounting and fixation)',
            'Prepare temporary slides and use them under a light microscope to estimate cell sizes (using onion bulbs, kales or young herbaceous plants)',
            'Use photomicrographs/charts to compare the structure of plant and animal cells as seen under electron microscope',
            'Draw and label the structure of plant and animal cells as seen under electron microscope',
            'Model the structure of plant and animal cells as seen under electron microscope using locally available materials',
            'Observe photomicrographs/permanent slides of specialised plant and animal cells, draw and label',
            'Discuss specialised cells in plants and animals and relate them to their function (root hair cells, palisade cells, guard cells, pollen grains; muscle cells, nerve cells, blood cells, reproductive cells)',
            'Discuss levels of organisation in an organism (organelles, cells, tissues, organs)',
          ]
        },
        {
          name: '1.4 Chemicals of Life',
          learningOutcomes: [
            'Describe the composition, properties and functions of the chemicals of life in organisms (carbohydrates, proteins, lipids, enzymes, vitamins, water and mineral salts)',
            'Investigate the presence of carbohydrates, lipids, proteins and vitamin C in food substances including locally available food substances',
            'Carry out experiments to investigate the presence of catalase enzymes in living tissues',
            'Determine factors affecting enzymatic reactions in cells (pH, temperature, substrate and enzyme concentration)',
            'Appreciate the importance of enzymes in living tissues',
            'Examine packaging labels of common food products and appreciate the quality, quantity and safety of the chemical components indicated (preservatives, colourings and expiry)',
          ]
        }
      ]
    },
    {
      name: '2.0 Anatomy and Physiology of Plants',
      subStrands: [
        {
          name: '2.1 Nutrition',
          learningOutcomes: [
            'Describe types of nutrition in plants',
            'Relate the structure of the chloroplast to its function in plant cells',
            'Illustrate the light and dark stages of photosynthesis in plants',
            'Appreciate the significance of photosynthesis in nature',
            'Search for information from available resources on different types of nutrition in plants and share with peers',
            'Discuss the structure of chloroplast in relation to its function',
            'Watch animations/video clips on the process of photosynthesis and discuss',
            'Discuss the reactions during the light and dark stages of photosynthesis using illustrations (flow charts, animations, equations)',
          ]
        },
        {
          name: '2.2 Transport',
          learningOutcomes: [
            'Relate structures of the plant transport system to their functions in plants',
            'Illustrate the arrangement of vascular tissues in monocotyledonous and dicotyledonous plants',
            'Demonstrate the uptake of water and mineral salts from the roots to the leaves',
            'Demonstrate factors that affect the rate of transpiration in plants',
            'Describe the translocation of manufactured food in plants',
            'Use a microscope/hand lens to observe and draw cross sections of monocotyledonous and dicotyledonous roots and stems',
            'Search for information on mechanisms of water and mineral salt uptake in plants (root pressure, capillarity, transpiration pull)',
            'Carry out experiments to demonstrate uptake of water in plants using locally available materials',
            'Search for information on structural and environmental factors that affect the rate of transpiration',
            'Carry out a bark ringing/girdling experiment to demonstrate evidence of translocation',
          ]
        },
        {
          name: '2.3 Gaseous Exchange and Respiration',
          learningOutcomes: [
            'Explain the meaning of gaseous exchange and its significance to plants and the environment',
            'Observe sites of gaseous exchange in plants (cuticle, lenticel, stomata, pneumatophores)',
            'Discuss the adaptations of gaseous exchange sites in plants to their function in aquatic and terrestrial environments',
            'Search for information on the mechanism of opening and closing of stomata (photosynthetic theory, starch-sugar interconversion theory, potassium ions theory)',
            'Investigate aerobic and anaerobic respiration in living organisms',
            'Explain the economic importance of anaerobic respiration',
            'Appreciate the significance of gaseous exchange and respiration to nature',
            'Carry out a project on fermentation using locally available materials (biogas production, porridge, silage, liquid manure or baking)',
          ]
        }
      ]
    },
    {
      name: '3.0 Anatomy and Physiology of Animals',
      subStrands: [
        {
          name: '3.1 Nutrition',
          learningOutcomes: [
            'Collect fresh specimens of locust/grasshopper/cockroach and observe the mouthparts using a hand lens or dissecting microscope',
            'Search for information on mouthparts of insects (biting and chewing: locust/grasshopper/cockroach; piercing and sucking: mosquito, tsetse fly; siphoning: butterfly/moth)',
            'Watch animations/videos and study illustrations of mouthparts of different insects; discuss how mouthparts are related to mode of feeding',
            'Observe images/animations/charts of beaks of birds with different modes of feeding (grains/seeds, nectar, fish, flesh, filter feeders, multipurpose, wood chippers, insect eaters, fruit eaters)',
            'Discuss how beaks are adapted to the mode of feeding',
            'Undertake a nature walk to observe different birds and their feeding habits and write a short report',
          ]
        },
        {
          name: '3.2 Transport',
          learningOutcomes: [
            'Explain the importance of transport in animals',
            'Illustrate the structure of transport systems in insects, fish, amphibians, reptiles and mammals',
            'Describe the pumping mechanism of the mammalian heart',
            'Search for information on different transport systems in animals (open and closed, single and double circulatory systems)',
            'Watch animations illustrating the human lymphatic system and pumping mechanism of a mammalian heart',
            'Dissect a small mammal to observe and draw parts of the transport system',
            'Watch animations illustrating the mechanism of blood clotting',
            'Prepare charts illustrating blood donor-recipient compatibility',
            'Visit a health facility and discuss the ABO and Rhesus blood grouping systems with a resource person',
          ]
        },
        {
          name: '3.3 Gaseous Exchange and Respiration',
          learningOutcomes: [
            'Explain the general characteristics of respiratory surfaces in animals',
            'Describe the structure and adaptations of respiratory structures in animals (insects-tracheal system, fish-gills, amphibians-lungs/buccal cavity/skin, birds-lungs, mammals-lungs)',
            'Describe the mechanism of gaseous exchange in humans',
            'Describe the process of aerobic and anaerobic respiration',
            'Calculate the respiratory quotient for different foods',
            'Observe and discuss images/photomicrographs of respiratory surfaces of animals',
            'Collect locusts/grasshoppers from the local environment and make observations of gaseous exchange',
            'Dissect a small mammal, observe and draw the gaseous exchange structures',
            'Make models to demonstrate inhalation and exhalation in humans',
            'Carry out experiments on aerobic and anaerobic respiration',
            'Carry out a project on construction of models to demonstrate the process of gaseous exchange',
          ]
        }
      ]
    }
  ]
};

// Grade 10 Power Mechanics Curriculum — KICD 2025
export const grade10PowerMechanicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 10',
  subject: 'Power Mechanics',
  strands: [
    {
      name: '1.0 Fundamentals of Power Mechanics',
      subStrands: [
        { name: '1.1 Overview of Power Mechanics', learningOutcomes: [
          'Define Power Mechanics and describe its scope',
          'Identify local career and entrepreneurial opportunities in Power Mechanics',
          'List and evaluate activities related to Power Mechanics in the community',
          'Explain the importance of Power Mechanics in society',
        ]},
        { name: '1.2 Evolution of Motor Vehicles', learningOutcomes: [
          'Describe the historical development of the automobile',
          'Analyse trends in vehicle design and innovation',
          'Explain the role of innovation in Power Mechanics',
        ]},
        { name: '1.3 Power Mechanics Workshop Layout', learningOutcomes: [
          'Identify and describe the main areas in a Power Mechanics workshop',
          'Sketch a basic workshop layout including necessary equipment and spaces',
          'Explain the importance of good workshop layout',
        ]},
        { name: '1.4 Workshop Safety and Regulations', learningOutcomes: [
          'State general workshop safety rules and use appropriate PPE',
          'Recognise and interpret workshop safety signs and symbols',
          'Demonstrate safe handling and maintenance of basic workshop tools and equipment',
        ]},
      ],
    },
    {
      name: '2.0 Related Technical Drawing',
      subStrands: [
        { name: '2.1 Diagonal Scales', learningOutcomes: [
          'Use a diagonal scale to measure and draw lengths that are not whole units',
          'Construct a diagonal scale using basic drawing tools',
          'Apply diagonal scale in a drawing task',
        ]},
        { name: '2.2 Loci Construction', learningOutcomes: [
          'Construct basic geometric loci using compass and straightedge',
          'Explain how loci are used in designing mechanical parts or paths',
          'Analyse and solve simple technical problems using loci',
        ]},
        { name: '2.3 Tangency of Lines and Curves', learningOutcomes: [
          'Draw tangent lines and tangent circles to given curves',
          'Construct blending curves between straight lines',
          'Explain the importance of tangents and blends in engineering design',
        ]},
        { name: '2.4 Blending Curves', learningOutcomes: [
          'Use geometric tools to draw smooth curves that blend between given lines or arcs',
          'Discuss how blended curves are used in vehicle design',
          'Apply blending techniques in a drawing exercise',
        ]},
      ],
    },
    {
      name: '3.0 Motor Vehicle Systems',
      subStrands: [
        { name: '3.1 Road Wheels and Axles', learningOutcomes: [
          'Identify the main components of a wheel and axle assembly',
          'Explain wheel and axle function, including load bearing and rotation',
          'Perform a basic wheel alignment or inflation check',
        ]},
        { name: '3.2 Motor Vehicle Body', learningOutcomes: [
          'Describe common vehicle body materials and structures',
          'Explain the function of body panels and their impact on aerodynamics',
          'Identify body maintenance tasks and basic repair methods',
        ]},
        { name: '3.3 Vehicle Chassis and Frame', learningOutcomes: [
          'Differentiate types of vehicle chassis and their uses',
          'Explain how chassis design affects vehicle performance',
          'Inspect a chassis for damage or corrosion',
        ]},
        { name: '3.4 Body Joining Processes', learningOutcomes: [
          'Identify common body joining methods',
          'Explain advantages and safety considerations of each joining process',
          'Demonstrate a simple joining task',
        ]},
      ],
    },
    {
      name: '4.0 Engines',
      subStrands: [
        { name: '4.1 Introduction to Engines', learningOutcomes: [
          'Define what an engine is and describe its basic function in a vehicle',
          'Explain the difference between external and internal combustion engines',
          'Identify energy sources used by different engine types',
        ]},
        { name: '4.2 Types of Engines', learningOutcomes: [
          'Differentiate main types of internal combustion engines',
          'Describe how a simple four-stroke engine works',
          'Explain characteristics of diesel and petrol engines',
        ]},
        { name: '4.3 Engine Classification', learningOutcomes: [
          'Classify engines by cylinder arrangement and cooling method',
          'Explain how engine size and number of cylinders affect performance',
          'Identify examples of engine classifications in real vehicles',
        ]},
        { name: '4.4 Engine Components', learningOutcomes: [
          'Identify and describe key engine components',
          'Explain the function of lubrication and cooling systems',
          'Perform a simple engine maintenance task',
        ]},
      ],
    },
  ],
};

// Grade 10 Physics Curriculum — KICD 2025
export const grade10PhysicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 10',
  subject: 'Physics',
  strands: [
    {
      name: '1.0 Mechanics and Thermal Physics',
      subStrands: [
        { name: '1.1 Introduction to Physics', learningOutcomes: [
          'Explain what Physics is and describe its branches',
          'Outline the importance of Physics in daily life',
          'Relate Physics to other subjects and identify possible STEM careers',
        ]},
        { name: '1.2 Pressure', learningOutcomes: [
          'Describe atmospheric pressure and demonstrate its existence',
          'Investigate factors affecting pressure in liquids',
          'Apply the formula P = ρgh in calculations',
          'Explain Pascal\u2019s principle and analyse its applications',
          'Discuss everyday applications of pressure (straw, syringe, pump, blood pressure)',
        ]},
        { name: '1.3 Mechanical Properties of Materials', learningOutcomes: [
          'Define mechanical properties of materials',
          'Classify materials according to mechanical properties',
          'Demonstrate Hooke\u2019s Law experimentally (F = kx)',
          'Calculate and interpret stress, strain and Young\u2019s modulus',
          'Relate mechanical properties to real-life applications',
        ]},
        { name: '1.4 Temperature and Thermal Expansion', learningOutcomes: [
          'Explain temperature scales and convert between Celsius and Kelvin',
          'Measure temperature using different instruments',
          'Describe linear thermal expansion and its consequences',
          'Apply the expansion formula ΔL = αLΔT in calculations',
          'Relate thermal expansion to real-life applications',
        ]},
        { name: '1.5 Moments and Equilibrium', learningOutcomes: [
          'Define moment of a force and calculate moments (M = Fd)',
          'Apply the principle of moments to solve balance problems',
          'Explain centre of gravity and stability',
          'Investigate forces in equilibrium',
          'Apply moments and equilibrium in real-life situations',
        ]},
        { name: '1.6 Energy, Work, Power and Machines', learningOutcomes: [
          'Define work, energy and power with correct units',
          'Calculate work, KE = ½mv², PE = mgh and power',
          'Demonstrate energy transformations and conservation',
          'Explain simple machines, mechanical advantage and efficiency',
          'Identify everyday machines and evaluate their use',
        ]},
      ],
    },
    {
      name: '2.0 Waves and Optics',
      subStrands: [
        { name: '2.1 Properties of Waves', learningOutcomes: [
          'Describe wave parameters (f, λ, A, v) and their relationships',
          'Investigate reflection, refraction, diffraction and interference',
          'Explain the Doppler effect qualitatively',
          'Apply wave concepts (v = fλ, AM/FM) to communication systems',
        ]},
        { name: '2.2 Radioactivity and Stability of Isotopes', learningOutcomes: [
          'Explain atomic structure and nuclear stability',
          'Define radioactivity and identify alpha, beta and gamma decay',
          'Demonstrate or simulate detection of radioactivity',
          'Calculate half-life from sample data',
          'Discuss applications of radioactivity and evaluate safety precautions',
        ]},
      ],
    },
    {
      name: '3.0 Electricity and Magnetism',
      subStrands: [
        { name: '3.1 Electrostatics', learningOutcomes: [
          'Define electric charge',
          'Demonstrate charging by friction, contact and induction',
          'Construct and use a gold leaf electroscope',
          'Explain applications of electrostatics (lightning rods, precipitators, photocopiers)',
        ]},
        { name: '3.2 Current Electricity', learningOutcomes: [
          'Describe current, voltage and resistance',
          'State and use Ohm\u2019s Law (V = IR) in circuits',
          'Investigate factors affecting resistance',
          'Construct series and parallel circuits',
          'Calculate electrical power (P = IV) and energy (kWh)',
          'Explain internal resistance and terminal voltage (V = ε − Ir)',
        ]},
        { name: '3.3 Introduction to Electronics', learningOutcomes: [
          'Classify materials as conductors, insulators and semiconductors',
          'Describe how P-type, N-type and P–N junctions work',
          'Identify electronic components (diodes, transistors, LEDs)',
          'Explain one basic application of diodes or transistors (rectification, switching)',
          'Discuss modern electronics in daily life',
        ]},
      ],
    },
    {
      name: '4.0 Environmental and Space Physics',
      subStrands: [
        { name: '4.1 Greenhouse Effect and Climate Change', learningOutcomes: [
          'Explain the greenhouse effect',
          'Identify major greenhouse gases (CO₂, CH₄, H₂O vapour)',
          'Analyse causes and effects of global warming and climate change',
          'Discuss ozone layer function and depletion',
          'Identify climate change mitigation strategies',
          'Promote individual climate action',
        ]},
        { name: '4.2 Introduction to Space Physics', learningOutcomes: [
          'Describe the Big Bang theory and the structure of the universe',
          'Explain planetary motion and the solar system (Kepler\u2019s laws, qualitative)',
          'Discuss history and tools of space exploration',
          'Identify careers in space science',
          'Explore the space environment (microgravity, vacuum, radiation) and its effects',
        ]},
      ],
    },
  ],
};

// Grade 10 Core Mathematics Curriculum — KICD 2025
export const grade10MathematicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 10',
  subject: 'Mathematics',
  strands: [
    {
      name: '1.0 Numbers and Algebra',
      subStrands: [
        { name: '1.1 Real Numbers', learningOutcomes: [
          'Classify numbers as integers, rational or irrational',
          'Compute sums, differences, products and quotients of rational numbers',
          'Simplify surds and express answers in simplest radical form',
          'Solve simple one-variable equations and verify by substitution',
        ]},
        { name: '1.2 Indices and Logarithms', learningOutcomes: [
          'Apply the laws of indices to simplify expressions',
          'Solve simple exponential equations using a common base',
          'Convert between exponential and logarithmic form',
          'Use logarithms and a scientific calculator to solve exponential problems',
        ]},
        { name: '1.3 Quadratic Expressions and Equations', learningOutcomes: [
          'Expand and factor quadratic expressions',
          'Complete the square for selected quadratics',
          'Solve quadratic equations by factorisation and by the quadratic formula',
          'Sketch quadratic graphs and interpret vertex, intercepts and axis of symmetry',
        ]},
      ],
    },
    {
      name: '2.0 Measurement and Geometry',
      subStrands: [
        { name: '2.1 Similarity and Enlargement', learningOutcomes: [
          'Prove similarity of triangles using angle-angle reasoning',
          'Calculate scale factors for similar figures',
          'Solve perimeter and area problems involving similar figures',
          'Construct enlarged and reduced copies of shapes using a given scale factor',
        ]},
        { name: '2.2 Transformation, Reflection, Rotation and Congruence', learningOutcomes: [
          'Reflect shapes across given lines and justify congruence',
          'Rotate shapes through 90°, 180° and 270° about a point',
          'Identify congruent shapes in different orientations',
          'Describe transformation sequences on a coordinate plane',
        ]},
        { name: '2.3 Trigonometry 1', learningOutcomes: [
          'Define sine, cosine and tangent in right-angled triangles',
          'Apply SOHCAHTOA to calculate missing sides and angles',
          'Use a scientific calculator correctly (DEG mode) for trig values',
          'Solve real-world right-triangle problems (elevation/depression)',
        ]},
        { name: '2.4 Areas of Polygons', learningOutcomes: [
          'Calculate areas of regular polygons using appropriate formulae',
          'Find areas of compound shapes by decomposition',
          'Calculate the area of a circle sector',
          'Solve practical design problems involving area and unit conversion',
        ]},
      ],
    },
    {
      name: '3.0 Statistics and Probability',
      subStrands: [
        { name: '3.1 Statistics', learningOutcomes: [
          'Collect data using a survey or experiment',
          'Represent data using frequency tables, bar charts and line graphs',
          'Compute mean, median and mode accurately',
          'Interpret data displays to answer statistical questions',
        ]},
        { name: '3.2 Probability 1', learningOutcomes: [
          'Define probability terms (trial, outcome, event, sample space)',
          'Calculate simple probabilities for single events using P(E) = n(E)/n(S)',
          'Use Venn diagrams and simple tree diagrams for events',
          'Compare theoretical and experimental probability',
        ]},
      ],
    },
  ],
};

// Grade 10 Essential Mathematics Curriculum — KICD 2025
// For Social Sciences / Arts & Sports / non-STEM pathway learners
export const grade10EssentialMathematicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 10',
  subject: 'Essential Mathematics',
  strands: [
    {
      name: '1.0 Numbers and Algebra',
      subStrands: [
        { name: '1.1 Real Numbers', learningOutcomes: [
          'Classify numbers as integers, rational or irrational with at least 90% accuracy',
          'Perform addition and subtraction of rational numbers correctly',
          'Simplify surds fully using square factors (e.g. √72 = 6√2)',
          'Solve simple equations involving absolute value and explain the solution',
        ]},
        { name: '1.2 Indices and Logarithms', learningOutcomes: [
          'Apply laws of exponents to simplify expressions',
          'Solve simple exponential equations by finding the unknown index',
          'Convert correctly between exponential and logarithmic forms',
          'Use logarithms to solve exponential equations',
        ]},
        { name: '1.3 Quadratic Expressions and Equations', learningOutcomes: [
          'Expand and factor quadratic expressions',
          'Complete the square to rewrite a quadratic expression',
          'Solve quadratic equations by factorisation and by formula, showing steps',
          'Graph quadratic functions and interpret roots, vertex and intercepts',
        ]},
      ],
    },
    {
      name: '2.0 Measurements and Geometry',
      subStrands: [
        { name: '2.1 Similarity and Enlargement', learningOutcomes: [
          'Prove triangle similarity using the AA criterion',
          'Calculate scale factors between similar shapes',
          'Relate lengths, perimeters and areas of similar figures',
          'Construct enlarged and reduced shapes by a given scale factor',
        ]},
        { name: '2.2 Transformations: Reflections, Rotations and Congruence', learningOutcomes: [
          'Reflect shapes across coordinate axes and verify congruence',
          'Rotate shapes by 90° or 180° and identify invariant points',
          'Identify congruent shapes under transformations',
          'Describe and compose transformation sequences on the coordinate plane',
        ]},
        { name: '2.3 Trigonometry 1', learningOutcomes: [
          'Define sine, cosine and tangent in right triangles',
          'Apply SOHCAHTOA to find missing sides and angles',
          'Solve real-world height, distance and navigation problems',
          'Use a scientific calculator to find trigonometric values accurately',
        ]},
        { name: '2.4 Areas of Polygons', learningOutcomes: [
          'Compute area of polygons accurately',
          'Derive and apply formulas for composite areas',
          'Solve problems involving shaded regions',
          'Use circle area and sector concepts in practical problems',
        ]},
      ],
    },
    {
      name: '3.0 Statistics and Probability',
      subStrands: [
        { name: '3.1 Statistics', learningOutcomes: [
          'Collect data using a survey or experiment',
          'Organise data in frequency tables',
          'Represent data using bar charts, line graphs and histograms',
          'Calculate and interpret mean, median and mode from datasets',
        ]},
        { name: '3.2 Probability', learningOutcomes: [
          'Define outcome, event and related probability terms',
          'Calculate simple probabilities for coins, dice and cards',
          'Solve combined probability problems (AND, OR, probability trees)',
          'Compare theoretical and experimental probability',
        ]},
      ],
    },
  ],
};

// Registry of all senior secondary curriculum data
export const seniorSecondaryCurriculumData: SeniorSubjectCurriculum[] = [
  grade10AgricultureCurriculum,
  grade10ChemistryCurriculum,
  grade10BiologyCurriculum,
  grade10PowerMechanicsCurriculum,
  grade10PhysicsCurriculum,
  grade10MathematicsCurriculum,
  grade10EssentialMathematicsCurriculum,
];

/**
 * Get strands for a senior secondary subject
 */
export function getSeniorSecondaryStrands(grade: string, subject: string): string[] {
  const curriculum = seniorSecondaryCurriculumData.find(
    c => c.grade === grade && c.subject.toLowerCase() === subject.toLowerCase()
  );
  return curriculum ? curriculum.strands.map(s => s.name) : [];
}

/**
 * Get sub-strands for a senior secondary strand
 */
export function getSeniorSecondarySubStrands(grade: string, subject: string, strand: string): string[] {
  const curriculum = seniorSecondaryCurriculumData.find(
    c => c.grade === grade && c.subject.toLowerCase() === subject.toLowerCase()
  );
  if (!curriculum) return [];
  const strandData = curriculum.strands.find(s => s.name === strand);
  return strandData ? strandData.subStrands.map(ss => ss.name) : [];
}

/**
 * Get learning outcomes for a senior secondary sub-strand
 */
export function getSeniorSecondaryLearningOutcomes(grade: string, subject: string, strand: string, subStrand: string): string[] {
  const curriculum = seniorSecondaryCurriculumData.find(
    c => c.grade === grade && c.subject.toLowerCase() === subject.toLowerCase()
  );
  if (!curriculum) return [];
  const strandData = curriculum.strands.find(s => s.name === strand);
  if (!strandData) return [];
  const subStrandData = strandData.subStrands.find(ss => ss.name === subStrand);
  return subStrandData ? subStrandData.learningOutcomes : [];
}

/**
 * Get full curriculum data for a senior secondary subject (compatible with getCurriculumData format)
 */
export function getSeniorSecondaryCurriculumAsStrands(grade: string, subject: string): Record<string, string[]> {
  const curriculum = seniorSecondaryCurriculumData.find(
    c => c.grade === grade && c.subject.toLowerCase() === subject.toLowerCase()
  );
  if (!curriculum) return {};
  
  const result: Record<string, string[]> = {};
  curriculum.strands.forEach(strand => {
    result[strand.name] = strand.subStrands.map(ss => ss.name);
  });
  return result;
}

