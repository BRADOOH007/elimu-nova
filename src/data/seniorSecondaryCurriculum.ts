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

// OLD registry — replaced below with full Grade 10-12 registry


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

// ============================================================
// Grade 11 Curriculum Data — KICD 2025
// ============================================================

export const grade11AgricultureCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 11',
  subject: 'Agriculture',
  strands: [
    {
      name: '1.0 Crop Production II',
      subStrands: [
        { name: '1.1 Soil Fertility Management', learningOutcomes: [
          'Analyse the role of organic matter in soil fertility improvement',
          'Carry out soil sampling and testing for nutrient deficiencies',
          'Prepare and apply organic and inorganic fertilisers appropriately',
          'Develop a crop nutrition program based on soil test results',
          'Evaluate the environmental impact of fertiliser use and propose sustainable alternatives',
        ]},
        { name: '1.2 Irrigation and Water Management', learningOutcomes: [
          'Compare different irrigation methods (surface, drip, overhead, sub-surface)',
          'Calculate crop water requirements for selected crops',
          'Design a simple irrigation layout for a small-scale farm',
          'Demonstrate water conservation techniques in crop production',
          'Discuss the economic and environmental implications of irrigation farming',
        ]},
        { name: '1.3 Pest and Disease Management', learningOutcomes: [
          'Identify common crop pests and diseases in major food and cash crops',
          'Describe the life cycles of selected crop pests for timely intervention',
          'Apply integrated pest management (IPM) strategies in crop production',
          'Handle and apply agro-chemicals safely and responsibly',
          'Evaluate the effectiveness of biological control methods in pest management',
        ]},
        { name: '1.4 Post-Harvest Management', learningOutcomes: [
          'Explain the physiological and biochemical changes during crop maturation and ripening',
          'Apply appropriate harvesting techniques for different crop types',
          'Demonstrate proper post-harvest handling, grading and packaging procedures',
          'Design and implement a post-harvest loss reduction strategy',
          'Explore value-addition opportunities for selected crop produce',
        ]},
        { name: '1.5 Emerging Trends in Crop Production', learningOutcomes: [
          'Research emerging trends in crop production (hydroponics, aeroponics, vertical farming)',
          'Analyse the potential of greenhouse technology in Kenyan agriculture',
          'Discuss the role of biotechnology in crop improvement (GMOs, tissue culture)',
          'Evaluate the opportunities and challenges of climate-smart agriculture',
          'Develop a proposal for an innovative crop production enterprise',
        ]},
      ],
    },
    {
      name: '2.0 Animal Production II',
      subStrands: [
        { name: '2.1 Animal Nutrition and Feeding', learningOutcomes: [
          'Classify animal feeds based on their nutrient composition (roughages, concentrates, supplements)',
          'Formulate balanced rations for different classes of livestock',
          'Analyse the digestive systems of ruminants and non-ruminants',
          'Carry out feed analysis to determine nutritional value',
          'Develop a feeding program for a selected livestock enterprise',
        ]},
        { name: '2.2 Animal Breeding and Genetics', learningOutcomes: [
          'Explain the principles of animal breeding (selection, mating systems, heritability)',
          'Apply breeding techniques to improve livestock productivity',
          'Discuss the role of biotechnology in animal breeding (AI, embryo transfer, gene editing)',
          'Maintain accurate breeding records for a livestock enterprise',
          'Evaluate breeding programs in terms of genetic gain and economic returns',
        ]},
        { name: '2.3 Livestock Health Management', learningOutcomes: [
          'Diagnose common livestock diseases based on clinical signs and symptoms',
          'Develop a herd health management plan including vaccination and biosecurity protocols',
          'Administer veterinary drugs and treatments following proper protocols',
          'Discuss the economic impact of disease outbreaks on livestock production',
          'Implement notifiable disease reporting procedures as per Kenyan regulations',
        ]},
        { name: '2.4 Livestock Products Processing', learningOutcomes: [
          'Process milk, meat, eggs and hides following quality standards',
          'Apply food safety and hygiene principles in livestock product handling',
          'Evaluate value-addition opportunities for livestock products',
          'Carry out quality testing of livestock products for market readiness',
          'Develop a business plan for a livestock products processing enterprise',
        ]},
      ],
    },
    {
      name: '3.0 Agricultural Economics and Entrepreneurship',
      subStrands: [
        { name: '3.1 Farm Business Management', learningOutcomes: [
          'Prepare farm budgets, cash flow statements and enterprise budgets',
          'Apply farm record-keeping systems for decision making',
          'Calculate farm profitability using gross margin and net profit analysis',
          'Evaluate farm investment opportunities using cost-benefit analysis',
          'Develop a comprehensive business plan for an agricultural enterprise',
        ]},
        { name: '3.2 Agricultural Marketing and Value Chains', learningOutcomes: [
          'Analyse agricultural value chains and identify opportunities for improvement',
          'Apply marketing strategies to maximise returns from agricultural produce',
          'Use digital platforms for agricultural marketing and e-commerce',
          'Evaluate the role of cooperatives and farmer organisations in marketing',
          'Develop a marketing plan for an agricultural product or enterprise',
        ]},
        { name: '3.3 Agricultural Policy and Development', learningOutcomes: [
          'Analyse Kenya\u2019s agricultural policies and their impact on farmers',
          'Discuss the role of agricultural extension services in technology transfer',
          'Evaluate government programs supporting agricultural development (e.g., subsidised fertiliser, credit schemes)',
          'Examine the relationship between agriculture and food security in Kenya',
          'Propose policy recommendations for sustainable agricultural development',
        ]},
      ],
    },
  ],
};

export const grade11BiologyCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 11',
  subject: 'Biology',
  strands: [
    {
      name: '1.0 Cell Physiology and Genetics',
      subStrands: [
        { name: '1.1 Cell Physiology', learningOutcomes: [
          'Explain the mechanisms of transport across cell membranes (diffusion, osmosis, active transport, facilitated diffusion)',
          'Carry out experiments to demonstrate osmosis and diffusion using plant and animal tissues',
          'Describe the factors affecting the rate of transport across cell membranes',
          'Relate cell physiology to the adaptation of organisms to their environments',
          'Discuss the significance of cell transport mechanisms in living organisms',
        ]},
        { name: '1.2 Genetics I', learningOutcomes: [
          'Explain the structure and function of DNA and RNA',
          'Describe the process of DNA replication, transcription and translation',
          'Apply Mendelian principles to solve genetic crosses involving monohybrid and dihybrid inheritance',
          'Discuss the role of chromosomes in inheritance (sex determination, linkage, crossing over)',
          'Explore the ethical implications of genetic engineering and biotechnology',
        ]},
        { name: '1.3 Cell Division', learningOutcomes: [
          'Describe the stages of mitosis and meiosis with the aid of diagrams',
          'Compare mitosis and meiosis in terms of purpose, process and outcome',
          'Explain the significance of mitosis in growth, repair and asexual reproduction',
          'Explain the significance of meiosis in genetic variation and sexual reproduction',
          'Observe prepared slides of onion root tips to identify stages of mitosis',
        ]},
        { name: '1.4 Growth and Development', learningOutcomes: [
          'Explain the patterns of growth in plants and animals (sigmoid curve, intermittent growth)',
          'Describe the role of growth hormones in plant development (auxins, gibberellins, cytokinins)',
          'Investigate factors affecting seed germination and seedling growth',
          'Discuss the role of metamorphosis in insect development',
          'Carry out experiments on tropic responses in plants (phototropism, geotropism, hydrotropism)',
        ]},
      ],
    },
    {
      name: '2.0 Plant Physiology and Ecology',
      subStrands: [
        { name: '2.1 Plant Nutrition II', learningOutcomes: [
          'Explain the mechanism of mineral salt absorption in plants (active uptake, ion exchange)',
          'Describe the roles of essential macro and micronutrients in plant growth',
          'Diagnose nutrient deficiency symptoms in plants using visual keys',
          'Carry out tissue culture techniques for plant propagation',
          'Evaluate the role of mycorrhizal associations in plant nutrition',
        ]},
        { name: '2.2 Ecology II', learningOutcomes: [
          'Describe the structure and function of ecosystems (terrestrial and aquatic)',
          'Analyse energy flow and nutrient cycling in ecosystems (carbon, nitrogen, water cycles)',
          'Investigate population dynamics using sampling techniques (quadrats, transects, mark-recapture)',
          'Evaluate the impact of human activities on ecosystem stability and biodiversity',
          'Develop a conservation plan for a local ecosystem or threatened species',
        ]},
        { name: '2.3 Reproduction in Plants', learningOutcomes: [
          'Describe the structure and functions of flower parts in relation to reproduction',
          'Explain the processes of pollination, fertilisation, seed and fruit development',
          'Compare different types of inflorescences and their adaptive significance',
          'Carry out artificial pollination and hybridisation techniques',
          'Discuss the economic importance of seeds and fruits in agriculture and industry',
        ]},
      ],
    },
    {
      name: '3.0 Animal Physiology and Adaptation',
      subStrands: [
        { name: '3.1 Reproduction in Animals', learningOutcomes: [
          'Describe the structure and functions of the human male and female reproductive systems',
          'Explain the menstrual cycle, fertilisation, implantation and embryonic development',
          'Discuss the role of hormones in human reproduction and their feedback mechanisms',
          'Evaluate family planning methods and their effectiveness',
          'Analyse the causes and prevention of sexually transmitted infections including HIV/AIDS',
        ]},
        { name: '3.2 Excretion and Homeostasis', learningOutcomes: [
          'Describe the structure of the human excretory system and the process of urine formation',
          'Explain the role of the skin, lungs and liver in excretion',
          'Describe the mechanisms of homeostasis (temperature regulation, osmoregulation, blood glucose regulation)',
          'Carry out experiments to demonstrate the effects of exercise on body temperature and pulse rate',
          'Discuss the consequences of homeostatic imbalance (diabetes, kidney failure, dehydration)',
        ]},
        { name: '3.3 Coordination and Response', learningOutcomes: [
          'Describe the structure and function of the nervous system (central and peripheral)',
          'Explain the mechanism of nerve impulse transmission and synaptic transmission',
          'Describe the structure and function of the human eye and ear',
          'Explain how sense organs detect stimuli and initiate responses',
          'Discuss the effects of drugs on the nervous system and the importance of drug abuse prevention',
        ]},
      ],
    },
  ],
};

export const grade11ChemistryCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 11',
  subject: 'Chemistry',
  strands: [
    {
      name: '1.0 Inorganic Chemistry II',
      subStrands: [
        { name: '1.1 Chemical Kinetics', learningOutcomes: [
          'Define rate of reaction and explain factors affecting reaction rates (concentration, temperature, surface area, catalysts, pressure)',
          'Carry out experiments to determine the effect of concentration and temperature on reaction rates',
          'Calculate reaction rates from experimental data and draw rate curves',
          'Explain collision theory and its application in predicting reaction rates',
          'Discuss the importance of reaction rates in industrial processes and everyday life',
        ]},
        { name: '1.2 Chemical Equilibria', learningOutcomes: [
          'Explain the concept of dynamic equilibrium in reversible reactions',
          'Apply Le Chatelier\u2019s principle to predict the effect of changes in conditions on equilibrium position',
          'Calculate equilibrium constants (Kc) from experimental data',
          'Discuss the Haber process and Contact process as applications of equilibrium principles',
          'Evaluate the economic and environmental implications of equilibrium-based industrial processes',
        ]},
        { name: '1.3 Electrochemistry', learningOutcomes: [
          'Differentiate between electrolytic cells and electrochemical (galvanic) cells',
          'Carry out electrolysis experiments using various electrolytes and electrodes',
          'Apply Faraday\u2019s laws of electrolysis to calculate quantities of substances liberated',
          'Describe the construction and functioning of dry cells, lead-acid batteries and fuel cells',
          'Discuss the applications of electrochemistry in industry (electroplating, metal extraction, corrosion prevention)',
        ]},
        { name: '1.4 Transition Elements', learningOutcomes: [
          'Describe the general properties of transition elements (variable oxidation states, coloured compounds, catalytic activity, magnetic properties)',
          'Explain the electronic configurations of transition elements and their ions',
          'Carry out experiments to investigate the properties of selected transition metals and their compounds',
          'Discuss the uses of transition metals in industry and daily life (iron, copper, zinc, chromium, manganese)',
          'Explore the economic importance of transition metals in Kenya\u2019s mining sector',
        ]},
      ],
    },
    {
      name: '2.0 Organic Chemistry II',
      subStrands: [
        { name: '2.1 Hydrocarbons', learningOutcomes: [
          'Classify hydrocarbons into alkanes, alkenes, alkynes and aromatic hydrocarbons',
          'Explain the nomenclature, structure and isomerism in hydrocarbons',
          'Describe the physical and chemical properties of alkanes, alkenes and alkynes',
          'Carry out experiments to distinguish between saturated and unsaturated hydrocarbons',
          'Discuss the industrial importance of hydrocarbons as fuels, solvents and raw materials for the petrochemical industry',
        ]},
        { name: '2.2 Alcohols and Phenols', learningOutcomes: [
          'Classify alcohols as primary, secondary and tertiary based on structure',
          'Describe the physical and chemical properties of alcohols and phenols',
          'Carry out experiments to demonstrate the reactions of alcohols (oxidation, esterification, dehydration)',
          'Explain the industrial production of ethanol by fermentation and hydration of ethene',
          'Discuss the economic importance and health implications of ethanol and methanol',
        ]},
        { name: '2.3 Carbonyl Compounds', learningOutcomes: [
          'Distinguish between aldehydes and ketones based on their structure and properties',
          'Describe the preparation and chemical reactions of aldehydes and ketones',
          'Carry out tests to distinguish between aldehydes and ketones (Tollens\u2019 test, Fehling\u2019s test)',
          'Explain the mechanism of nucleophilic addition reactions in carbonyl compounds',
          'Discuss the importance of carbonyl compounds in the manufacture of polymers, pharmaceuticals and agrochemicals',
        ]},
        { name: '2.4 Carboxylic Acids and Derivatives', learningOutcomes: [
          'Describe the structure, classification and nomenclature of carboxylic acids and their derivatives',
          'Explain the physical and chemical properties of carboxylic acids (acidity, esterification, formation of acyl chlorides)',
          'Carry out experiments to prepare and identify esters by their characteristic odour',
          'Describe the hydrolysis of esters, amides and acyl chlorides',
          'Discuss the economic importance of carboxylic acids and derivatives in the manufacture of soaps, detergents, plastics and pharmaceuticals',
        ]},
      ],
    },
    {
      name: '3.0 Environmental Chemistry',
      subStrands: [
        { name: '3.1 Water Chemistry and Treatment', learningOutcomes: [
          'Analyse the chemical composition of natural waters and sources of water pollution',
          'Carry out water quality tests (pH, hardness, dissolved oxygen, turbidity, BOD, COD)',
          'Explain the methods of water treatment for domestic and industrial use',
          'Discuss the environmental impact of water pollution on aquatic ecosystems and human health',
          'Design a water treatment and conservation plan for a community',
        ]},
        { name: '3.2 Air Pollution and Climate Change', learningOutcomes: [
          'Identify major air pollutants and their sources (CO, CO₂, SO₂, NOx, particulate matter, VOCs)',
          'Analyse the chemical reactions leading to acid rain, photochemical smog and ozone depletion',
          'Discuss the greenhouse effect and the chemistry of climate change',
          'Carry out experiments to demonstrate the effects of acid rain on materials and plants',
          'Evaluate mitigation strategies for air pollution and climate change at individual, community and national levels',
        ]},
        { name: '3.3 Green Chemistry and Sustainability', learningOutcomes: [
          'Explain the principles of green chemistry and their application in reducing environmental impact',
          'Analyse industrial processes for their environmental footprint and propose greener alternatives',
          'Discuss the role of chemistry in developing sustainable materials (biodegradable plastics, renewable energy technologies)',
          'Evaluate waste management strategies including recycling, composting and waste-to-energy technologies',
          'Develop a proposal for a green chemistry initiative in a local industry or community',
        ]},
      ],
    },
  ],
};

export const grade11PhysicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 11',
  subject: 'Physics',
  strands: [
    {
      name: '1.0 Mechanics II',
      subStrands: [
        { name: '1.1 Linear Motion and Newton\u2019s Laws', learningOutcomes: [
          'Derive and apply equations of linear motion (v = u + at, s = ut + ½at², v² = u² + 2as)',
          'Apply Newton\u2019s laws of motion to solve problems involving forces',
          'Analyse motion graphs (displacement-time, velocity-time) to determine acceleration and displacement',
          'Investigate the relationship between force, mass and acceleration using experimental methods',
          'Solve problems involving friction, inclined planes and connected bodies',
        ]},
        { name: '1.2 Circular Motion and Gravitation', learningOutcomes: [
          'Define angular displacement, angular velocity and centripetal acceleration',
          'Apply the equations for circular motion (a = v²/r, F = mv²/r) in problem-solving',
          'Explain Newton\u2019s law of universal gravitation and its applications',
          'Analyse satellite motion, orbital velocity and escape velocity',
          'Discuss the applications of circular motion in daily life (banked tracks, centrifuges, planetary motion)',
        ]},
        { name: '1.3 Fluid Mechanics', learningOutcomes: [
          'Explain Archimedes\u2019 principle and the law of flotation',
          'Apply Bernoulli\u2019s principle to explain lift, atomisers and venturi meters',
          'Determine the density of liquids and solids using Archimedes\u2019 principle',
          'Investigate factors affecting viscous drag and terminal velocity in fluids',
          'Solve problems involving pressure, buoyancy and fluid flow',
        ]},
      ],
    },
    {
      name: '2.0 Waves and Optics II',
      subStrands: [
        { name: '2.1 Wave Phenomena', learningOutcomes: [
          'Explain the principles of superposition, interference and diffraction of waves',
          'Carry out experiments to demonstrate interference patterns in ripple tanks',
          'Describe the Doppler effect and calculate frequency shifts in sound and light',
          'Apply the laws of reflection and refraction in solving optical problems',
          'Discuss the applications of wave phenomena in technology (ultrasound, SONAR, optical fibres)',
        ]},
        { name: '2.2 Lenses and Optical Instruments', learningOutcomes: [
          'Describe the formation of images by convex and concave lenses using ray diagrams',
          'Apply the lens formula and magnification equation to solve optical problems',
          'Explain the working principles of optical instruments (microscope, telescope, camera, projector)',
          'Determine the focal length of lenses using experimental methods',
          'Discuss the defects of vision (myopia, hypermetropia, astigmatism) and their correction',
        ]},
        { name: '2.3 Electromagnetic Waves and Communication', learningOutcomes: [
          'Describe the electromagnetic spectrum and the properties of each region',
          'Explain the principles of radio communication including modulation (AM/FM) and demodulation',
          'Discuss the applications of electromagnetic waves in communication (radio, TV, mobile phones, satellite communication)',
          'Analyse the advantages and limitations of wireless communication technologies',
          'Explore the role of fibre optics in modern communication systems',
        ]},
      ],
    },
    {
      name: '3.0 Electricity and Magnetism II',
      subStrands: [
        { name: '3.1 Electromagnetic Induction', learningOutcomes: [
          'Explain the principles of electromagnetic induction (Faraday\u2019s law, Lenz\u2019s law)',
          'Carry out experiments to demonstrate electromagnetic induction',
          'Describe the construction and working of AC and DC generators',
          'Explain the operation of transformers and calculate voltage and current ratios',
          'Discuss the importance of transformers in power transmission and distribution',
        ]},
        { name: '3.2 Alternating Current Circuits', learningOutcomes: [
          'Describe the characteristics of alternating current (frequency, amplitude, phase, RMS values)',
          'Analyse AC circuits containing resistors, capacitors and inductors (RLC circuits)',
          'Calculate impedance, phase angle and power factor in AC circuits',
          'Explain resonance in series and parallel RLC circuits',
          'Discuss the applications of AC circuits in household appliances and industrial equipment',
        ]},
        { name: '3.3 Electronics II', learningOutcomes: [
          'Explain the characteristics and applications of operational amplifiers (op-amps)',
          'Design and test basic electronic circuits (rectifiers, amplifiers, oscillators, logic gates)',
          'Describe the working principles of digital electronics including binary systems and logic circuits',
          'Build simple electronic projects using sensors, microcontrollers and output devices',
          'Discuss the impact of electronic technology on society and emerging trends (IoT, AI hardware, quantum computing)',
        ]},
      ],
    },
  ],
};

export const grade11MathematicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 11',
  subject: 'Mathematics',
  strands: [
    {
      name: '1.0 Algebra and Functions',
      subStrands: [
        { name: '1.1 Sequences and Series', learningOutcomes: [
          'Identify arithmetic and geometric sequences and determine their general terms',
          'Calculate sums of arithmetic and geometric series (finite and infinite)',
          'Apply sequences and series to solve real-world problems (loan repayments, population growth, depreciation)',
          'Use the binomial theorem to expand expressions of the form (a + b)ⁿ',
          'Prove mathematical statements using the principle of mathematical induction',
        ]},
        { name: '1.2 Rational Expressions and Equations', learningOutcomes: [
          'Simplify rational algebraic expressions by factorising and cancelling common factors',
          'Solve rational equations and identify extraneous solutions',
          'Perform operations on rational expressions (addition, subtraction, multiplication, division)',
          'Solve equations involving algebraic fractions with linear and quadratic denominators',
          'Apply rational expressions in solving real-world problems (motion, mixture, work problems)',
        ]},
        { name: '1.3 Exponentials and Logarithms', learningOutcomes: [
          'Graph exponential and logarithmic functions and identify their key features',
          'Apply the laws of logarithms to simplify expressions and solve equations',
          'Solve exponential and logarithmic equations with different bases',
          'Use logarithms to model real-world phenomena (radioactive decay, bacterial growth, pH)',
          'Apply exponential models to problems involving compound interest and population dynamics',
        ]},
      ],
    },
    {
      name: '2.0 Geometry and Trigonometry',
      subStrands: [
        { name: '2.1 Trigonometry II', learningOutcomes: [
          'Derive and apply trigonometric identities (Pythagorean, sum/difference, double-angle)',
          'Solve trigonometric equations for specified intervals',
          'Apply the sine rule and cosine rule to solve problems involving non-right-angled triangles',
          'Calculate the area of triangles using the formula Area = ½ab sin C',
          'Solve three-dimensional trigonometry problems involving bearings and angles of elevation/depression',
        ]},
        { name: '2.2 Coordinate Geometry II', learningOutcomes: [
          'Determine the equation of a circle in standard and general form',
          'Find the equation of a tangent and normal to a circle at a given point',
          'Solve problems involving the intersection of lines and circles',
          'Apply coordinate geometry to solve locus problems',
          'Use parametric equations to represent curves and solve related problems',
        ]},
        { name: '2.3 Vectors II', learningOutcomes: [
          'Perform vector operations in two and three dimensions (addition, subtraction, scalar multiplication, dot product, cross product)',
          'Calculate the magnitude and direction of vectors in 3D',
          'Apply vectors to solve problems involving displacement, velocity and forces',
          'Use the dot product to determine the angle between two vectors and test for perpendicularity',
          'Apply vectors in solving geometric problems in 3D space',
        ]},
      ],
    },
    {
      name: '3.0 Calculus and Statistics',
      subStrands: [
        { name: '3.1 Introduction to Calculus', learningOutcomes: [
          'Explain the concept of limits and continuity of functions',
          'Differentiate functions from first principles using the limit definition',
          'Apply differentiation rules (power, product, quotient, chain rule) to find derivatives',
          'Use derivatives to solve problems involving rates of change, gradients and optimisation',
          'Integrate simple polynomial functions and apply integration to find areas under curves',
        ]},
        { name: '3.2 Probability II', learningOutcomes: [
          'Apply the laws of probability (addition, multiplication) to solve complex probability problems',
          'Calculate conditional probability and use Bayes\u2019 theorem in problem-solving',
          'Use probability distributions (binomial, Poisson, normal) to model real-world scenarios',
          'Calculate expected values and variances of random variables',
          'Apply probability concepts to decision-making under uncertainty',
        ]},
        { name: '3.3 Statistical Inference', learningOutcomes: [
          'Explain the concepts of population, sample, sampling methods and sampling distributions',
          'Construct and interpret confidence intervals for population means and proportions',
          'Perform hypothesis tests (z-test, t-test) for means and proportions',
          'Apply correlation and regression analysis to determine relationships between variables',
          'Use spreadsheets or statistical software to analyse data and present findings',
        ]},
      ],
    },
  ],
};

export const grade11EssentialMathematicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 11',
  subject: 'Essential Mathematics',
  strands: [
    {
      name: '1.0 Practical Algebra and Functions',
      subStrands: [
        { name: '1.1 Sequences and Series in Context', learningOutcomes: [
          'Identify patterns in numerical sequences from everyday contexts',
          'Calculate terms of arithmetic sequences and simple geometric sequences',
          'Apply sequences to personal finance (savings plans, loan instalments, depreciation)',
          'Use the binomial theorem to expand (a + b)ⁿ for small n',
        ]},
        { name: '1.2 Financial Algebra', learningOutcomes: [
          'Solve proportional reasoning problems involving ratios, rates and percentages',
          'Calculate simple and compound interest, hire purchase and depreciation',
          'Prepare personal and household budgets using spreadsheet tools',
          'Analyse financial data to make informed spending and saving decisions',
        ]},
        { name: '1.3 Exponentials in Real Life', learningOutcomes: [
          'Recognise exponential growth and decay in real situations (population, prices, depreciation)',
          'Read and interpret exponential graphs in news articles and reports',
          'Use logarithms to solve simple exponential equations with a calculator',
          'Apply the Rule of 72 to estimate doubling time for investments',
        ]},
      ],
    },
    {
      name: '2.0 Applied Geometry and Measurement',
      subStrands: [
        { name: '2.1 Trigonometry in Practice', learningOutcomes: [
          'Apply sine, cosine and tangent to solve practical problems involving right triangles',
          'Use the sine rule and cosine rule in navigation and surveying contexts',
          'Calculate areas of triangles and sectors in practical design problems',
          'Use trigonometry in sports, construction and visual arts contexts',
        ]},
        { name: '2.2 Measurement and Design', learningOutcomes: [
          'Calculate surface areas and volumes of composite solids (prisms, cylinders, cones, spheres)',
          'Apply measurement concepts to interior design, packaging and construction',
          'Solve optimisation problems involving materials and cost',
          'Use scale drawings and models in practical design projects',
        ]},
        { name: '2.3 Vectors in Practical Contexts', learningOutcomes: [
          'Represent quantities using vectors in two dimensions',
          'Add and subtract vectors graphically to solve displacement problems',
          'Calculate magnitudes and directions of resultant vectors',
          'Apply vectors to navigation, sport and force analysis in simple machines',
        ]},
      ],
    },
    {
      name: '3.0 Data, Probability and Decision Making',
      subStrands: [
        { name: '3.1 Data Collection and Analysis', learningOutcomes: [
          'Design and conduct surveys to collect primary data on community issues',
          'Organise and represent data using appropriate graphs and charts with digital tools',
          'Calculate and interpret measures of central tendency and dispersion',
          'Draw conclusions and make recommendations based on data analysis',
          'Evaluate the reliability of data sources and identify misleading statistics',
        ]},
        { name: '3.2 Probability in Decision Making', learningOutcomes: [
          'Calculate probabilities of compound events using tree diagrams and tables',
          'Apply probability concepts to games of chance, insurance and risk assessment',
          'Use expected value to make informed decisions in uncertain situations',
          'Simulate random events using digital tools and compare with theoretical probabilities',
        ]},
        { name: '3.3 Financial Mathematics for Life', learningOutcomes: [
          'Analyse the cost of borrowing including APR, interest rates and loan terms',
          'Compare investment options using return on investment (ROI) calculations',
          'Prepare and analyse profit and loss statements for small businesses',
          'Evaluate tax implications (PAYE, VAT, withholding tax) on personal and business income',
          'Develop a personal financial plan incorporating savings, investment and insurance',
        ]},
      ],
    },
  ],
};

export const grade11PowerMechanicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 11',
  subject: 'Power Mechanics',
  strands: [
    {
      name: '1.0 Engine Systems II',
      subStrands: [
        { name: '1.1 Engine Performance and Testing', learningOutcomes: [
          'Explain the principles of engine performance including power output, torque and efficiency',
          'Conduct compression tests and cylinder leakage tests to diagnose engine condition',
          'Perform engine tune-up procedures including spark plug replacement, timing adjustment and valve clearance setting',
          'Analyse engine performance data to identify problems and recommend solutions',
          'Discuss the factors affecting engine efficiency and methods of improvement',
        ]},
        { name: '1.2 Fuel and Exhaust Systems', learningOutcomes: [
          'Describe the components and operation of modern fuel injection systems (EFI, common rail, direct injection)',
          'Diagnose and repair common fuel system faults using diagnostic equipment',
          'Explain the operation of emission control systems (catalytic converter, EGR, EVAP)',
          'Carry out exhaust system inspection and maintenance',
          'Discuss the environmental impact of vehicle emissions and emission reduction technologies',
        ]},
        { name: '1.3 Lubrication and Cooling Systems', learningOutcomes: [
          'Explain the importance of lubrication in reducing friction and wear in engines',
          'Describe the components and operation of the lubrication system',
          'Perform oil analysis to determine engine condition and maintenance needs',
          'Describe the components and operation of cooling systems (air-cooled, liquid-cooled)',
          'Diagnose and repair common cooling system problems (overheating, leaks, thermostat failure)',
        ]},
      ],
    },
    {
      name: '2.0 Transmission and Drivetrain',
      subStrands: [
        { name: '2.1 Clutches and Gearboxes', learningOutcomes: [
          'Describe the types and operation of clutches (single plate, multi-plate, hydraulic, cable-operated)',
          'Diagnose and repair common clutch faults (slipping, juddering, dragging)',
          'Explain the operation of manual and automatic transmissions',
          'Perform gearbox inspection, servicing and fault diagnosis',
          'Discuss the advantages and disadvantages of different transmission types',
        ]},
        { name: '2.2 Final Drive and Differential', learningOutcomes: [
          'Explain the function and operation of the final drive and differential',
          'Describe the types of differentials (open, limited-slip, locking) and their applications',
          'Diagnose and repair common differential faults (noise, vibration, leaks)',
          'Perform drive shaft and CV joint inspection and replacement',
          'Discuss the role of the drivetrain in vehicle performance and handling',
        ]},
        { name: '2.3 Four-Wheel Drive Systems', learningOutcomes: [
          'Explain the principles of four-wheel drive (4WD) and all-wheel drive (AWD) systems',
          'Identify the components of 4WD systems (transfer case, locking hubs, differentials)',
          'Diagnose and repair common 4WD system faults',
          'Compare the performance characteristics of 4WD, AWD and 2WD vehicles',
          'Discuss the applications of 4WD systems in off-road and commercial vehicles',
        ]},
      ],
    },
    {
      name: '3.0 Vehicle Electrical and Electronic Systems',
      subStrands: [
        { name: '3.1 Automotive Electrical Systems', learningOutcomes: [
          'Explain the principles of automotive electrical systems (starting, charging, lighting)',
          'Diagnose and repair starting system faults (starter motor, solenoid, wiring)',
          'Test and repair charging system components (alternator, voltage regulator, battery)',
          'Use wiring diagrams and multimeters to trace and repair electrical faults',
          'Discuss the importance of proper electrical system maintenance in vehicle reliability',
        ]},
        { name: '3.2 Engine Management Systems', learningOutcomes: [
          'Explain the role of the Engine Control Unit (ECU) in modern vehicles',
          'Describe the operation of sensors (O₂, MAF, MAP, knock, throttle position, crankshaft) and actuators',
          'Use diagnostic scan tools to read and interpret fault codes',
          'Perform basic ECU diagnostics and sensor testing',
          'Discuss emerging trends in vehicle electronics (drive-by-wire, CAN bus systems, telematics)',
        ]},
        { name: '3.3 Automotive Safety Systems', learningOutcomes: [
          'Explain the operation of passive safety systems (seatbelts, airbags, crumple zones)',
          'Describe the operation of active safety systems (ABS, ESP, traction control, brake assist)',
          'Diagnose and repair common safety system faults',
          'Discuss the importance of regular safety system inspections and maintenance',
          'Evaluate the effectiveness of different vehicle safety technologies in reducing accidents',
        ]},
      ],
    },
  ],
};

// ============================================================
// Grade 12 Curriculum Data — KICD 2025
// ============================================================

export const grade12AgricultureCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 12',
  subject: 'Agriculture',
  strands: [
    {
      name: '1.0 Sustainable Agriculture',
      subStrands: [
        { name: '1.1 Climate-Smart Agriculture', learningOutcomes: [
          'Analyse the impact of climate change on agricultural productivity in Kenya',
          'Implement climate-smart agricultural practices (conservation agriculture, agroforestry, drought-resistant varieties)',
          'Develop a climate adaptation plan for a farming enterprise',
          'Evaluate the effectiveness of climate-smart interventions in different agro-ecological zones',
          'Advocate for climate-smart agriculture in the community through awareness campaigns',
        ]},
        { name: '1.2 Organic and Regenerative Agriculture', learningOutcomes: [
          'Compare organic, regenerative and conventional farming systems',
          'Design and implement an organic farm management plan including certification requirements',
          'Prepare organic compost, bio-pesticides and botanical extracts for pest control',
          'Evaluate the economic viability of organic farming enterprises in Kenya',
          'Promote regenerative agriculture practices for soil health restoration and carbon sequestration',
        ]},
        { name: '1.3 Agricultural Project Development and Management', learningOutcomes: [
          'Identify viable agricultural business opportunities through market research',
          'Develop comprehensive project proposals including feasibility studies and business plans',
          'Apply project management tools (Gantt charts, critical path analysis, monitoring and evaluation)',
          'Secure funding through grants, loans and investor pitches for agricultural projects',
          'Implement and evaluate an agricultural project using appropriate success metrics',
        ]},
      ],
    },
    {
      name: '2.0 Agricultural Technology and Innovation',
      subStrands: [
        { name: '2.1 Precision Agriculture', learningOutcomes: [
          'Explain the principles and technologies of precision agriculture (GPS, GIS, remote sensing, IoT sensors)',
          'Use digital tools to monitor soil conditions, crop health and weather patterns',
          'Apply precision agriculture techniques to optimise input use (water, fertiliser, pesticides)',
          'Analyse data from precision agriculture systems to make informed management decisions',
          'Evaluate the cost-benefit of precision agriculture adoption for small-scale and large-scale farmers',
        ]},
        { name: '2.2 Agricultural Mechanisation and Automation', learningOutcomes: [
          'Evaluate the appropriate level of mechanisation for different farm scales and enterprises',
          'Operate and maintain agricultural machinery safely and efficiently',
          'Explain the role of automation and robotics in modern agriculture (drones, robotic harvesters, automated irrigation)',
          'Analyse the economic and social implications of agricultural mechanisation on employment',
          'Develop a mechanisation plan for a farm enterprise considering costs, benefits and sustainability',
        ]},
        { name: '2.3 Biotechnology in Agriculture', learningOutcomes: [
          'Explain the applications of biotechnology in crop improvement (tissue culture, genetic modification, marker-assisted selection)',
          'Evaluate the benefits and risks of genetically modified organisms (GMOs) in Kenyan agriculture',
          'Discuss the regulatory framework for biotechnology in Kenya (NBA, biosafety laws)',
          'Apply tissue culture techniques for mass propagation of disease-free planting materials',
          'Debate the ethical and socio-economic implications of biotechnology in agriculture',
        ]},
      ],
    },
    {
      name: '3.0 Agricultural Enterprise and Career Pathways',
      subStrands: [
        { name: '3.1 Agri-Business Management', learningOutcomes: [
          'Develop comprehensive business plans for agricultural enterprises including market analysis, financial projections and risk assessment',
          'Apply supply chain management principles to agricultural value chains',
          'Use financial management tools for agricultural enterprises (profitability analysis, break-even analysis, cash flow management)',
          'Evaluate the role of agricultural finance institutions and credit facilities in Kenya',
          'Develop strategies for scaling agricultural enterprises from small-scale to commercial operations',
        ]},
        { name: '3.2 Career Pathways in Agriculture', learningOutcomes: [
          'Research career opportunities in the agricultural sector (agronomy, veterinary science, agricultural engineering, food technology, agri-business)',
          'Identify training and education pathways for careers in agriculture (universities, TVET institutions, apprenticeships)',
          'Develop a personal career development plan in the agricultural sector',
          'Connect with professionals and organisations in the agricultural sector for mentorship and networking',
          'Demonstrate entrepreneurial skills relevant to agricultural career pathways',
        ]},
        { name: '3.3 Food Security and Policy', learningOutcomes: [
          'Analyse the state of food security in Kenya using indicators (availability, access, utilisation, stability)',
          'Evaluate the effectiveness of food security programs and policies in Kenya',
          'Design community-based food security interventions addressing local challenges',
          'Discuss the role of technology in improving food security (e.g., mobile platforms for market information, weather advisory services)',
          'Advocate for policies and practices that promote sustainable food systems',
        ]},
      ],
    },
  ],
};

export const grade12BiologyCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 12',
  subject: 'Biology',
  strands: [
    {
      name: '1.0 Genetics II and Evolution',
      subStrands: [
        { name: '1.1 Molecular Genetics', learningOutcomes: [
          'Explain the structure and replication of DNA in detail (semi-conservative replication, Okazaki fragments)',
          'Describe the mechanism of gene expression (transcription, RNA processing, translation, protein folding)',
          'Explain gene regulation in prokaryotes (operon model) and eukaryotes (transcription factors, epigenetics)',
          'Discuss the applications of molecular genetics in medicine, agriculture and forensics',
          'Perform DNA extraction from plant tissue using simple laboratory techniques',
        ]},
        { name: '1.2 Genetic Engineering and Biotechnology', learningOutcomes: [
          'Explain the techniques of genetic engineering (gene isolation, vector construction, transformation, selection)',
          'Describe the applications of biotechnology in medicine (insulin production, gene therapy, vaccine development)',
          'Evaluate the ethical, legal and social implications of genetic engineering and cloning',
          'Discuss the regulatory framework for biotechnology in Kenya and internationally',
          'Debate the role of genetic engineering in addressing global challenges (food security, disease, climate change)',
        ]},
        { name: '1.3 Evolution and Natural Selection', learningOutcomes: [
          'Explain the evidence for evolution (fossil record, comparative anatomy, molecular biology, biogeography)',
          'Describe Darwin\u2019s theory of natural selection and modern synthesis',
          'Analyse mechanisms of speciation (allopatric, sympatric, adaptive radiation)',
          'Trace the evolutionary history of humans using fossil evidence and genetic data',
          'Discuss the importance of biodiversity in the context of evolution and conservation',
        ]},
      ],
    },
    {
      name: '2.0 Human Biology and Health',
      subStrands: [
        { name: '2.1 Human Immunology', learningOutcomes: [
          'Describe the structure and function of the human immune system (innate and adaptive immunity)',
          'Explain the mechanisms of immune response (humoral and cell-mediated immunity)',
          'Discuss the role of vaccines in disease prevention and herd immunity',
          'Analyse the causes and effects of immune disorders (allergies, autoimmune diseases, immunodeficiency)',
          'Evaluate the global impact of HIV/AIDS including prevention, treatment and social implications',
        ]},
        { name: '2.2 Human Nutrition and Health', learningOutcomes: [
          'Analyse the nutritional requirements at different life stages',
          'Evaluate the impact of diet on health (obesity, diabetes, cardiovascular disease, malnutrition)',
          'Plan balanced diets for individuals and communities considering local food availability',
          'Discuss the role of food fortification and supplementation in addressing micronutrient deficiencies',
          'Promote healthy eating habits through community nutrition education',
        ]},
        { name: '2.3 Emerging Diseases and Public Health', learningOutcomes: [
          'Describe the epidemiology of emerging and re-emerging infectious diseases (COVID-19, Ebola, Rift Valley fever, antimicrobial resistance)',
          'Explain the principles of disease surveillance, outbreak investigation and control',
          'Analyse the role of environmental factors and human behaviour in disease emergence',
          'Evaluate national and global health systems and policies for disease prevention',
          'Develop a community health awareness campaign addressing a local health challenge',
        ]},
      ],
    },
    {
      name: '3.0 Ecology, Conservation and Career Pathways',
      subStrands: [
        { name: '3.1 Conservation Biology', learningOutcomes: [
          'Explain the principles of conservation biology including island biogeography and metapopulation dynamics',
          'Analyse the threats to biodiversity (habitat loss, invasive species, overexploitation, climate change)',
          'Evaluate conservation strategies (protected areas, ex-situ conservation, community-based conservation, restoration ecology)',
          'Discuss Kenya\u2019s efforts in wildlife conservation and the role of communities in conservation',
          'Develop a conservation action plan for a local ecosystem or species',
        ]},
        { name: '3.2 Environmental Impact Assessment', learningOutcomes: [
          'Explain the process and importance of Environmental Impact Assessment (EIA) in development projects',
          'Conduct a basic environmental audit for a local project or activity',
          'Analyse the ecological footprint of human activities and propose reduction strategies',
          'Evaluate the effectiveness of environmental laws and policies in Kenya (EMCA, NEMA)',
          'Advocate for sustainable development practices in the local community',
        ]},
        { name: '3.3 Career Pathways in Biology and Life Sciences', learningOutcomes: [
          'Research career opportunities in biological sciences (medicine, research, biotechnology, environmental science, education, pharmaceuticals)',
          'Identify higher education and training pathways for careers in life sciences',
          'Develop a personal career portfolio including academic and professional goals',
          'Connect with professionals in biological sciences for mentorship and guidance',
          'Demonstrate entrepreneurial skills relevant to biological science career pathways',
        ]},
      ],
    },
  ],
};

export const grade12ChemistryCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 12',
  subject: 'Chemistry',
  strands: [
    {
      name: '1.0 Advanced Inorganic Chemistry',
      subStrands: [
        { name: '1.1 Thermochemistry and Energy Changes', learningOutcomes: [
          'Explain enthalpy changes in chemical reactions (exothermic, endothermic, activation energy)',
          'Calculate enthalpy changes using Hess\u2019s law, bond energies and standard enthalpies of formation',
          'Carry out calorimetry experiments to determine enthalpy changes of reactions',
          'Apply thermochemical principles to evaluate energy efficiency of industrial processes',
          'Discuss the role of thermochemistry in developing alternative energy sources (hydrogen fuel, biofuels)',
        ]},
        { name: '1.2 Redox Reactions and Electrochemical Cells', learningOutcomes: [
          'Balance redox equations using oxidation number and half-reaction methods',
          'Construct electrochemical cells and measure cell potentials',
          'Apply the electrochemical series to predict redox reactions and cell potentials',
          'Explain the principles of corrosion and its prevention using electrochemical concepts',
          'Evaluate the applications of electrochemical cells in energy storage (lithium-ion batteries, fuel cells)',
        ]},
        { name: '1.3 Coordination Chemistry', learningOutcomes: [
          'Explain the nature of coordinate (dative covalent) bonding in complex ions and coordination compounds',
          'Describe the nomenclature, structure and isomerism of coordination compounds',
          'Explain the crystal field theory and its application in explaining colours of transition metal complexes',
          'Discuss the applications of coordination compounds in industry, medicine and analytical chemistry',
          'Prepare a coordination compound in the laboratory and investigate its properties',
        ]},
      ],
    },
    {
      name: '2.0 Advanced Organic Chemistry',
      subStrands: [
        { name: '2.1 Polymers and Polymerisation', learningOutcomes: [
          'Classify polymers based on origin (natural/synthetic), structure (linear/branched/cross-linked) and synthesis method (addition/condensation)',
          'Explain the mechanisms of addition and condensation polymerisation',
          'Describe the properties and uses of common synthetic polymers (polyethene, PVC, nylon, polyester, polystyrene)',
          'Evaluate the environmental impact of plastics and the challenges of plastic waste management',
          'Explore the development of biodegradable and sustainable polymer alternatives',
        ]},
        { name: '2.2 Organic Synthesis and Reaction Mechanisms', learningOutcomes: [
          'Plan multi-step organic synthesis routes for target molecules',
          'Explain reaction mechanisms using curly arrow notation (nucleophilic substitution, electrophilic addition, elimination, rearrangement)',
          'Apply retrosynthetic analysis to design synthetic pathways',
          'Evaluate factors affecting the yield and selectivity of organic reactions',
          'Discuss the principles of green chemistry in organic synthesis (atom economy, solvent selection, catalysis)',
        ]},
        { name: '2.3 Spectroscopy and Structure Determination', learningOutcomes: [
          'Explain the principles of infrared (IR) spectroscopy and interpret IR spectra to identify functional groups',
          'Explain the principles of nuclear magnetic resonance (NMR) spectroscopy and interpret simple ^¹H NMR spectra',
          'Use mass spectrometry data to determine molecular mass and fragmentation patterns',
          'Apply a combination of spectroscopic techniques to determine the structure of organic compounds',
          'Use chemical tests to confirm functional group identity in unknown compounds',
        ]},
      ],
    },
    {
      name: '3.0 Chemistry in Society and Career Pathways',
      subStrands: [
        { name: '3.1 Industrial Chemistry in Kenya', learningOutcomes: [
          'Analyse the chemical industry in Kenya (petroleum refining, fertiliser production, cement, sugar, soap and detergents, pharmaceuticals)',
          'Explain the chemical processes involved in selected Kenyan industries',
          'Evaluate the economic contribution of the chemical industry to Kenya\u2019s GDP',
          'Discuss the environmental and health impacts of industrial chemical processes',
          'Propose improvements for cleaner production and waste minimisation in Kenyan industries',
        ]},
        { name: '3.2 Analytical Chemistry and Quality Control', learningOutcomes: [
          'Explain the principles of volumetric analysis (titration) and gravimetric analysis',
          'Carry out quantitative analysis using appropriate laboratory techniques and instruments',
          'Apply quality control principles in chemical manufacturing and product testing',
          'Use statistical methods to evaluate the accuracy and precision of analytical data',
          'Discuss the role of analytical chemistry in ensuring food safety, drug quality and environmental monitoring',
        ]},
        { name: '3.3 Career Pathways in Chemistry', learningOutcomes: [
          'Research career opportunities in chemistry (pharmaceutical, petrochemical, environmental analysis, food science, forensic science, materials science)',
          'Identify higher education pathways and professional certifications in chemistry-related fields',
          'Develop a personal career development plan in the chemical sciences',
          'Connect with professionals and industry bodies in the chemical sector in Kenya',
          'Demonstrate entrepreneurial skills in chemical enterprises (soap making, water treatment, cosmetic formulation)',
        ]},
      ],
    },
  ],
};

export const grade12PhysicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 12',
  subject: 'Physics',
  strands: [
    {
      name: '1.0 Advanced Mechanics and Thermal Physics',
      subStrands: [
        { name: '1.1 Momentum and Collisions', learningOutcomes: [
          'State and apply the principle of conservation of linear momentum',
          'Distinguish between elastic and inelastic collisions and solve related problems',
          'Analyse collisions in one and two dimensions using vector methods',
          'Apply impulse-momentum theorem to real-world situations (sports, vehicle safety, rocket propulsion)',
          'Carry out experiments to investigate conservation of momentum in collisions',
        ]},
        { name: '1.2 Simple Harmonic Motion', learningOutcomes: [
          'Describe the characteristics of simple harmonic motion (SHM) using displacement, velocity, acceleration and energy equations',
          'Apply the equations for SHM: x = A cos(ωt + φ), v = -Aω sin(ωt + φ), a = -ω²x',
          'Analyse the energy changes in SHM (kinetic, potential, total energy)',
          'Investigate SHM using mass-spring systems and simple pendulums experimentally',
          'Discuss applications of SHM in technology (clocks, seismometers, suspension systems)',
        ]},
        { name: '1.3 Thermodynamics', learningOutcomes: [
          'State the zeroth, first and second laws of thermodynamics and their implications',
          'Apply the first law of thermodynamics (ΔU = Q - W) to thermodynamic processes',
          'Explain the concept of entropy and its relationship to the second law of thermodynamics',
          'Analyse the efficiency of heat engines and refrigerators using thermodynamic cycles (Carnot, Otto, Diesel)',
          'Discuss the applications of thermodynamics in power generation and refrigeration',
        ]},
      ],
    },
    {
      name: '2.0 Fields and Nuclear Physics',
      subStrands: [
        { name: '2.1 Gravitational Fields', learningOutcomes: [
          'Describe gravitational fields using field lines and gravitational field strength',
          'Apply Newton\u2019s law of gravitation to solve problems involving gravitational force and field strength',
          'Derive and apply expressions for gravitational potential energy and gravitational potential',
          'Analyse satellite motion including geostationary orbits, orbital energy and Kepler\u2019s laws',
          'Discuss the implications of gravitational phenomena in space exploration and astronomy',
        ]},
        { name: '2.2 Electric and Magnetic Fields', learningOutcomes: [
          'Describe electric fields using field lines, electric field strength and electric potential',
          'Apply Coulomb\u2019s law to calculate forces between point charges',
          'Explain the motion of charged particles in uniform electric and magnetic fields',
          'Describe the operation of devices using electric and magnetic fields (CRT, mass spectrometer, cyclotron)',
          'Calculate the force on a current-carrying conductor in a magnetic field (F = BIL sin θ)',
        ]},
        { name: '2.3 Nuclear Physics and Radioactivity', learningOutcomes: [
          'Describe the structure of the nucleus including binding energy and nuclear stability',
          'Explain the processes of radioactive decay (alpha, beta, gamma) including decay equations and half-life calculations',
          'Discuss the applications of radioisotopes in medicine (diagnosis, radiotherapy), industry (sterilisation, tracing) and agriculture',
          'Explain the principles of nuclear fission and fusion including chain reactions and energy release',
          'Evaluate the benefits and risks of nuclear energy including safety concerns and waste management',
        ]},
      ],
    },
    {
      name: '3.0 Modern Physics and Career Pathways',
      subStrands: [
        { name: '3.1 Quantum Physics', learningOutcomes: [
          'Explain the wave-particle duality of light and matter (Young\u2019s double-slit, photoelectric effect, de Broglie wavelength)',
          'Apply Einstein\u2019s photoelectric equation (hf = φ + KEmax) to solve problems',
          'Explain the quantum model of the atom including energy levels, quantum numbers and atomic spectra',
          'Describe the Heisenberg uncertainty principle and its implications for measurement',
          'Discuss the applications of quantum physics in modern technology (lasers, LEDs, semiconductors, quantum computing)',
        ]},
        { name: '3.2 Relativity and Cosmology', learningOutcomes: [
          'Explain the principles of special relativity (Einstein\u2019s postulates, time dilation, length contraction, mass-energy equivalence)',
          'Apply Einstein\u2019s mass-energy equivalence (E = mc²) in nuclear processes',
          'Describe the evidence for the expanding universe (Hubble\u2019s law, cosmic microwave background radiation)',
          'Discuss the Big Bang theory and the evolution of the universe',
          'Explore current research in cosmology and the frontiers of physics (dark matter, dark energy, gravitational waves)',
        ]},
        { name: '3.3 Applications of Physics in Technology and Careers', learningOutcomes: [
          'Explain the physical principles underlying modern technologies (lasers, fibre optics, solar cells, MRI, GPS)',
          'Research career opportunities in physics and engineering (aerospace, renewable energy, medical physics, telecommunications, research)',
          'Identify higher education pathways and professional opportunities in physics-related fields',
          'Develop a personal career development plan in physics and engineering',
          'Demonstrate innovation and entrepreneurship by designing a physics-based solution to a local problem',
        ]},
      ],
    },
  ],
};

export const grade12MathematicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 12',
  subject: 'Mathematics',
  strands: [
    {
      name: '1.0 Advanced Algebra and Calculus',
      subStrands: [
        { name: '1.1 Complex Numbers', learningOutcomes: [
          'Perform operations with complex numbers in Cartesian and polar form',
          'Represent complex numbers on the Argand diagram',
          'Apply De Moivre\u2019s theorem to find powers and roots of complex numbers',
          'Solve polynomial equations with complex roots',
          'Apply complex numbers to solve problems in alternating current circuits and fluid dynamics',
        ]},
        { name: '1.2 Advanced Calculus', learningOutcomes: [
          'Apply differentiation techniques including implicit differentiation, parametric differentiation and partial differentiation',
          'Apply integration techniques (integration by substitution, integration by parts, partial fractions)',
          'Use integration to calculate volumes of revolution and arc lengths',
          'Solve first-order differential equations (separable, linear, exact)',
          'Apply calculus to model real-world phenomena (population dynamics, radioactive decay, cooling, harmonic motion)',
        ]},
        { name: '1.3 Numerical Methods', learningOutcomes: [
          'Apply numerical methods to solve equations (bisection method, Newton-Raphson method)',
          'Use numerical integration techniques (trapezoidal rule, Simpson\u2019s rule)',
          'Solve systems of linear equations using matrix methods (Gaussian elimination, LU decomposition)',
          'Apply numerical techniques to solve differential equations (Euler\u2019s method, Runge-Kutta method)',
          'Use spreadsheet or programming tools to implement numerical methods',
        ]},
      ],
    },
    {
      name: '2.0 Geometry, Vectors and Matrices',
      subStrands: [
        { name: '2.1 Matrices and Linear Transformations', learningOutcomes: [
          'Perform matrix operations and calculate determinants and inverses of 3×3 matrices',
          'Solve systems of linear equations using matrix methods (Cramer\u2019s rule, matrix inversion, Gaussian elimination)',
          'Describe linear transformations using matrices (rotation, reflection, shear, scaling)',
          'Apply eigenvalues and eigenvectors to solve problems in vibrations, population dynamics and image processing',
          'Use matrices to model and solve real-world problems in economics, network analysis and computer graphics',
        ]},
        { name: '2.2 Three-Dimensional Geometry', learningOutcomes: [
          'Represent points, lines and planes in 3D space using vector equations',
          'Calculate distances, angles and intersections between lines and planes in 3D',
          'Apply vector methods to solve geometric problems in 3D (shortest distance, perpendicularity, coplanarity)',
          'Use 3D geometry concepts in practical contexts (architecture, navigation, computer graphics)',
          'Solve optimisation problems involving 3D shapes',
        ]},
        { name: '2.3 Proof and Mathematical Reasoning', learningOutcomes: [
          'Construct rigorous mathematical proofs using direct proof, proof by contradiction, proof by induction and contrapositive',
          'Analyse logical statements and arguments using propositional and predicate logic',
          'Apply set theory concepts to solve problems in probability and logic',
          'Prove fundamental theorems in algebra, geometry and number theory',
          'Communicate mathematical reasoning clearly and logically in written and oral form',
        ]},
      ],
    },
    {
      name: '3.0 Statistics, Probability and Decision Mathematics',
      subStrands: [
        { name: '3.1 Probability Distributions and Inference', learningOutcomes: [
          'Apply probability distributions (binomial, Poisson, normal, t-distribution, chi-squared) to model real-world data',
          'Conduct hypothesis tests (z-test, t-test, chi-squared test) and interpret results in context',
          'Calculate and interpret confidence intervals for population parameters',
          'Perform analysis of variance (ANOVA) to compare multiple group means',
          'Use statistical software to analyse data and communicate findings effectively',
        ]},
        { name: '3.2 Correlation, Regression and Time Series', learningOutcomes: [
          'Calculate and interpret Pearson\u2019s and Spearman\u2019s correlation coefficients',
          'Perform linear and multiple regression analysis and evaluate model fit (R², residuals)',
          'Apply time series analysis techniques (moving averages, trend analysis, seasonal variation) to forecast future values',
          'Use regression models to make predictions and inform decision-making',
          'Evaluate the limitations of statistical models and the risk of overfitting',
        ]},
        { name: '3.3 Operations Research and Decision Mathematics', learningOutcomes: [
          'Apply linear programming to solve optimisation problems with multiple constraints',
          'Use network analysis (critical path analysis, minimum spanning tree, shortest path) for project management',
          'Apply game theory to analyse competitive situations and strategic decision-making',
          'Use simulation techniques to model complex systems and support decision-making',
          'Present quantitative recommendations to stakeholders using appropriate visualisations',
        ]},
      ],
    },
  ],
};

export const grade12EssentialMathematicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 12',
  subject: 'Essential Mathematics',
  strands: [
    {
      name: '1.0 Mathematics for Life and Work',
      subStrands: [
        { name: '1.1 Personal Finance and Investment', learningOutcomes: [
          'Analyse different savings, investment and retirement planning options',
          'Calculate returns on various investment vehicles (stocks, bonds, mutual funds, real estate, SACCOs)',
          'Evaluate risk versus return in personal financial decision-making',
          'Prepare a comprehensive personal financial plan including budgeting, insurance, tax planning and estate planning',
          'Use spreadsheets to model financial scenarios and make informed decisions',
        ]},
        { name: '1.2 Business Mathematics', learningOutcomes: [
          'Calculate pricing strategies including mark-up, margin and break-even analysis',
          'Prepare and interpret financial statements (income statement, balance sheet, cash flow statement)',
          'Calculate payroll including PAYE, NHIF, NSSF and other statutory deductions',
          'Apply inventory management techniques (EOQ, FIFO, LIFO, weighted average)',
          'Use mathematical models to support business decision-making and growth planning',
        ]},
        { name: '1.3 Mathematics in Technology and Design', learningOutcomes: [
          'Use measurement and geometry concepts in technology and design contexts',
          'Apply scaling, proportion and geometric reasoning in design projects',
          'Use spreadsheet and graphing tools to model and solve practical problems',
          'Interpret technical drawings and schematics using geometric principles',
          'Apply mathematical reasoning to evaluate design alternatives and optimise solutions',
        ]},
      ],
    },
    {
      name: '2.0 Data-Driven Decision Making',
      subStrands: [
        { name: '2.1 Advanced Data Analysis', learningOutcomes: [
          'Collect, clean and organise large datasets using spreadsheet or database tools',
          'Create advanced data visualisations to communicate insights effectively',
          'Calculate and interpret statistical measures to support decision-making',
          'Identify trends, patterns and outliers in datasets and propose explanations',
          'Present data-driven recommendations to diverse audiences using appropriate formats',
        ]},
        { name: '2.2 Probability and Risk Assessment', learningOutcomes: [
          'Apply probability concepts to assess risk in personal and professional contexts',
          'Calculate expected values and use them in cost-benefit analysis',
          'Use probability trees and simulation to model uncertain outcomes',
          'Evaluate insurance products and warranties using probability reasoning',
          'Make informed decisions under uncertainty using expected value and risk assessment frameworks',
        ]},
        { name: '2.3 Statistical Reasoning in Society', learningOutcomes: [
          'Critically evaluate statistical claims in news, advertising and public policy',
          'Identify common statistical fallacies and misleading data presentations',
          'Analyse survey methodology including sampling bias and question wording effects',
          'Evaluate the use of statistics in governance, public health and social policy',
          'Communicate statistical findings responsibly and effectively in civic discourse',
        ]},
      ],
    },
    {
      name: '3.0 Mathematical Modelling and Career Readiness',
      subStrands: [
        { name: '3.1 Mathematical Modelling', learningOutcomes: [
          'Identify real-world situations that can be described mathematically',
          'Develop mathematical models using appropriate functions (linear, quadratic, exponential, logarithmic, trigonometric)',
          'Validate and refine models by comparing predictions with actual data',
          'Use models to make predictions and inform decision-making',
          'Communicate model assumptions, limitations and findings to non-technical audiences',
        ]},
        { name: '3.2 Quantitative Reasoning for Careers', learningOutcomes: [
          'Apply quantitative skills to career-specific contexts (healthcare, business, technology, trades, arts)',
          'Interpret numerical information in workplace documents (reports, budgets, specifications)',
          'Use estimation and approximation skills for quick decision-making in professional contexts',
          'Develop numerical literacy for career advancement and lifelong learning',
          'Demonstrate confidence in using mathematics in everyday professional situations',
        ]},
        { name: '3.3 Financial Independence and Entrepreneurship', learningOutcomes: [
          'Develop a comprehensive business plan for a small enterprise including market analysis, financial projections and risk assessment',
          'Calculate the cost of starting and operating a small business',
          'Analyse pricing, revenue and profit scenarios using mathematical models',
          'Evaluate financing options for small businesses including loans, grants and crowdfunding',
          'Demonstrate entrepreneurial mindset by identifying market opportunities and developing viable business ideas',
        ]},
      ],
    },
  ],
};

export const grade12PowerMechanicsCurriculum: SeniorSubjectCurriculum = {
  grade: 'Grade 12',
  subject: 'Power Mechanics',
  strands: [
    {
      name: '1.0 Advanced Engine Diagnostics and Management',
      subStrands: [
        { name: '1.1 Advanced Engine Diagnostics', learningOutcomes: [
          'Use advanced diagnostic equipment (oscilloscopes, gas analysers, scan tools) to diagnose complex engine faults',
          'Interpret diagnostic trouble codes (DTCs) and live data streams to identify root causes',
          'Perform systematic diagnostic procedures following OEM service information',
          'Diagnose intermittent and complex faults using logical reasoning and technical documentation',
          'Prepare detailed diagnostic reports with findings, recommendations and cost estimates',
        ]},
        { name: '1.2 Engine Management Systems II', learningOutcomes: [
          'Explain the operation of advanced engine management systems (variable valve timing, turbocharging, hybrid systems)',
          'Diagnose and repair advanced engine control system faults',
          'Perform ECU reprogramming and software updates following manufacturer procedures',
          'Analyse the interaction between engine, transmission and emission control systems',
          'Discuss emerging engine technologies (homogeneous charge compression ignition, electric turbocharging)',
        ]},
        { name: '1.3 Alternative Propulsion Systems', learningOutcomes: [
          'Explain the principles of hybrid electric vehicle (HEV) and electric vehicle (EV) powertrains',
          'Diagnose and maintain high-voltage systems in hybrid and electric vehicles following safety protocols',
          'Describe the operation of hydrogen fuel cell vehicles and other alternative fuel technologies',
          'Compare the environmental and economic impact of conventional and alternative propulsion systems',
          'Discuss the infrastructure requirements and challenges for widespread adoption of electric vehicles in Kenya',
        ]},
      ],
    },
    {
      name: '2.0 Vehicle Systems Integration',
      subStrands: [
        { name: '2.1 Suspension and Steering Systems', learningOutcomes: [
          'Describe the types and operation of suspension systems (MacPherson strut, double wishbone, multi-link, air suspension)',
          'Diagnose and repair common suspension and steering faults',
          'Perform wheel alignment (camber, caster, toe) and balancing procedures',
          'Explain the operation of power steering systems (hydraulic, electric, electro-hydraulic)',
          'Discuss the relationship between suspension geometry and vehicle handling',
        ]},
        { name: '2.2 Braking Systems', learningOutcomes: [
          'Describe the types and operation of braking systems (drum, disc, ABS, EBD, brake assist)',
          'Diagnose and repair braking system faults including hydraulic and electronic components',
          'Perform brake system servicing including pad replacement, disc machining and fluid flushing',
          'Explain the principles of regenerative braking in hybrid and electric vehicles',
          'Evaluate braking system performance using appropriate testing equipment',
        ]},
        { name: '2.3 Advanced Vehicle Electrical Systems', learningOutcomes: [
          'Diagnose and repair complex electrical system faults using wiring diagrams and diagnostic equipment',
          'Explain the operation of vehicle communication networks (CAN, LIN, MOST, FlexRay)',
          'Diagnose and repair body electrical systems (lighting, instrumentation, comfort and convenience systems)',
          'Describe the operation of advanced driver assistance systems (ADAS) including adaptive cruise control, lane keeping and automatic emergency braking',
          'Perform calibration procedures for ADAS sensors following manufacturer specifications',
        ]},
      ],
    },
    {
      name: '3.0 Workshop Management and Career Pathways',
      subStrands: [
        { name: '3.1 Workshop Management and Business Operations', learningOutcomes: [
          'Plan and organise a motor vehicle workshop layout for efficiency and safety',
          'Manage workshop operations including job scheduling, inventory management and quality control',
          'Prepare cost estimates and invoices for repair work',
          'Apply customer service principles and manage customer relationships effectively',
          'Develop a business plan for starting and operating a motor vehicle repair enterprise',
        ]},
        { name: '3.2 Occupational Health, Safety and Environmental Compliance', learningOutcomes: [
          'Implement occupational health and safety management systems in a workshop environment',
          'Identify and mitigate workplace hazards including chemical, electrical and mechanical risks',
          'Manage hazardous waste disposal in compliance with NEMA regulations',
          'Conduct workplace safety audits and incident investigations',
          'Promote a culture of safety and environmental responsibility in the workplace',
        ]},
        { name: '3.3 Career Pathways in Power Mechanics and Automotive Engineering', learningOutcomes: [
          'Research career opportunities in power mechanics and automotive engineering (vehicle diagnostics, motorsport engineering, fleet management, automotive design)',
          'Identify higher education and training pathways including TVET institutions, university programs and professional certifications',
          'Develop a personal career development plan in the automotive sector',
          'Connect with industry professionals and organisations for mentorship and networking',
          'Demonstrate entrepreneurial skills and innovation in automotive technology and services',
        ]},
      ],
    },
  ],
};

// Combined registry of ALL senior secondary curriculum data
export const seniorSecondaryCurriculumData: SeniorSubjectCurriculum[] = [
  grade10AgricultureCurriculum,
  grade10ChemistryCurriculum,
  grade10BiologyCurriculum,
  grade10PowerMechanicsCurriculum,
  grade10PhysicsCurriculum,
  grade10MathematicsCurriculum,
  grade10EssentialMathematicsCurriculum,
  grade11AgricultureCurriculum,
  grade11BiologyCurriculum,
  grade11ChemistryCurriculum,
  grade11PhysicsCurriculum,
  grade11MathematicsCurriculum,
  grade11EssentialMathematicsCurriculum,
  grade11PowerMechanicsCurriculum,
  grade12AgricultureCurriculum,
  grade12BiologyCurriculum,
  grade12ChemistryCurriculum,
  grade12PhysicsCurriculum,
  grade12MathematicsCurriculum,
  grade12EssentialMathematicsCurriculum,
  grade12PowerMechanicsCurriculum,
];
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

