import mysql from "mysql2";

export let traitProbability = {}; // объект внутри которого трейты  с вероятностями trait:[title],[probability]
export let traits;
export let conflicts;
export let unconditionalMatches;
let titleProbability;

const getTraitProbability = async () => { // на вход должен получать фильтр для таблиц
    const createConnection = () => {
        return mysql.createConnection({
            host: "database-2.clua1x1ptzge.us-east-1.rds.amazonaws.com",
            user: "admin",
            database: "rts_mysql_base",
            password: "11111111"
        });
    };

    const connection = await createConnection();
    connection.connect( function(err){
        if (err) {
            return console.error("Error: " + err.message);
        }
        else{
            console.log("Connect successfully");
            
            const queryTraitTypes = "SELECT * FROM traittypes";
            connection.query(queryTraitTypes, function (err, result) {
                if (err) throw err;
                traits = result;
                //console.log(traits);
            });
            
            const queryTitleProb = "SELECT * FROM traits";
            connection.query(queryTitleProb, function(err, result) {
                if (err) throw err;
                titleProbability = result;
                //console.log(titleProbability);
            });

            const queryConflicts = "SELECT * FROM conflicts";
            connection.query(queryConflicts, function(err, result) {
                if (err) throw err;
                conflicts = result;
                //console.log(conflicts);
            });

            const queryUnconditionalMatches = "SELECT * FROM unconditional_matches";
            connection.query(queryUnconditionalMatches, function(err, result){
                if (err) throw err;
                unconditionalMatches = result; 
            });

        }
    });

    setTimeout(()=>{
        connection.end(function(err) {
            if (err) {
                return console.log("Error: " + err.message);
            }
            console.log("Connection is closed");
          });
    }, 2000);
}

export const getConflicts = () =>{ // счет в титлах идет с нуля , поэтому -1
    let computeConflicts = [];

    for (let index = 0; index  < conflicts.length; index++) { // {trait_1: title, trait_2: title, replace: trait_substitute }
        const trait_1 = traits[titleProbability[conflicts[index]['trait_1_id']-1]['traittype_id']-1]['title'];
        const trait_2 = traits[titleProbability[conflicts[index]['trait_2_id']-1]['traittype_id']-1]['title'];
        computeConflicts[index] = {[trait_1] : titleProbability[conflicts[index]['trait_1_id']-1]['title'],
                                   [trait_2]: titleProbability[conflicts[index]['trait_2_id']-1]['title'],
                                   'replace': conflicts[index]['trait_substitute']}
        
    }
    return computeConflicts;
}

export const getUnconditionalMatches = () =>{ // счет в титлах идет с нуля , поэтому -1
    let computeUnconditionalMatches = [];

    for (let index = 0; index  < unconditionalMatches.length; index++) { // {trait_1: title, trait_2: title }.

        const trait = traits[titleProbability[unconditionalMatches[index]['trait_id']-1]['traittype_id']-1]['title'];
        const match = traits[titleProbability[unconditionalMatches[index]['match_trait_id']-1]['traittype_id']-1]['title'];
        computeUnconditionalMatches[index] = {[trait]: titleProbability[unconditionalMatches[index]['trait_id']-1]['title'],
                                              [match]: titleProbability[unconditionalMatches[index]['match_trait_id']-1]['title']}
        
    }
    return computeUnconditionalMatches;
}


export const requestData = async ()=>
{
    await getTraitProbability();
    setTimeout(() => {

        for (let i = 0; i < traits.length; i += 1){
            traitProbability[traits[i]['title']] = [[],[]]

            for (let j = 0; j< titleProbability.length; j +=1 ) {
                if (traits[i]['id'] === titleProbability[j]['traittype_id']){

                    traitProbability[traits[i]['title']][0].push(titleProbability[j]['title']);
                    traitProbability[traits[i]['title']][1].push(titleProbability[j]['probability']);
                }
            }
        }
    }, 5000) ;
}

export const getProbability = () => {
    return traitProbability;
} 

export const getTraitTitles = () => {
    return traits;
}

export const createTables = async() => {

    const createConnection = () => {
        return mysql.createConnection({
            host: "database-2.clua1x1ptzge.us-east-1.rds.amazonaws.com",
            user: "admin",
            database: "rts_mysql_base",
            password: "11111111"
        });
    };

    const connection = await createConnection();

    //здесь должны быть ${} с именами INDEX, и таблиц
    const queryCreateTraitTypes = `CREATE TABLE if not exists traittypes ( 
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT, 
        title VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci', 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, 
        PRIMARY KEY (id) USING BTREE 
    ) 
    COLLATE='utf8_general_ci' 
    ENGINE=InnoDB 
    ;`; 
    connection.query(queryCreateTraitTypes, function(err, results) {
        if(err) console.log(err);
        else console.log("Таблица создана traittypes");
    });

    //здесь должны быть ${} с именами INDEX, и таблиц
    const queryCreateTraitsTitle = `CREATE TABLE  if not exists traits ( 
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT, 
        traittype_id BIGINT(20) UNSIGNED NULL DEFAULT NULL, 
        title VARCHAR(255) NULL DEFAULT NULL COLLATE 'utf8mb4_0900_ai_ci', 
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        probability BIGINT(20) UNSIGNED NOT NULL, 
        PRIMARY KEY (id) USING BTREE, 
        INDEX FK_traits_traittypes (traittype_id) USING BTREE, 
        CONSTRAINT FK_traits_traittypes FOREIGN KEY (traittype_id) REFERENCES rts_mysql_base.traittypes (id) ON UPDATE SET NULL ON DELETE SET NULL
        ) 
    COLLATE='utf8_general_ci' 
    ENGINE=InnoDB 
    ;`;
    connection.query(queryCreateTraitsTitle, function(err, results) {
        if(err) console.log(err);
        else console.log("Таблица создана traits");
    });

    //здесь должны быть ${} с именами INDEX, и таблиц
    const queryCreateConflicts = `CREATE TABLE if not exists  conflicts (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        trait_1_id BIGINT(20) UNSIGNED NULL DEFAULT NULL,
        trait_2_id BIGINT(20) UNSIGNED NULL DEFAULT NULL,
        trait_substitute BIGINT(19) NOT NULL DEFAULT '0',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id) USING BTREE,
        INDEX FK_conflicts_traits_2 (trait_2_id) USING BTREE,
        INDEX FK_conflicts_traits_1 (trait_1_id) USING BTREE,
        CONSTRAINT FK_conflicts_traits_1 FOREIGN KEY (trait_1_id) REFERENCES rts_mysql_base.traits (id) ON UPDATE SET NULL ON DELETE SET NULL,
        CONSTRAINT FK_conflicts_traits_2 FOREIGN KEY (trait_2_id) REFERENCES rts_mysql_base.traits (id) ON UPDATE SET NULL ON DELETE SET NULL
    )
    COLLATE='utf8_general_ci'
    ENGINE=InnoDB
    ;`;
    connection.query(queryCreateConflicts, function(err, results) {
        if(err) console.log(err);
        else console.log("Таблица создана conflicts");
    });

    //здесь должны быть ${} с именами INDEX, и таблиц
    const queryCreateUnconditionalMatches = `CREATE TABLE if not exists  unconditional_matches (
        id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
        trait_id BIGINT(20) UNSIGNED NULL,
        match_trait_id BIGINT(20) UNSIGNED NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id) USING BTREE,
        INDEX FK_match (match_trait_id) USING BTREE,
        INDEX FK_traits (trait_id) USING BTREE,
        CONSTRAINT FK_unconditional_matches_traits_1 FOREIGN KEY (trait_id) REFERENCES rts_mysql_base.traits (id) ON UPDATE SET NULL ON DELETE SET NULL,
        CONSTRAINT FK_unconditional_matches_traits_2 FOREIGN KEY (match_trait_id) REFERENCES rts_mysql_base.traits (id) ON UPDATE SET NULL ON DELETE SET NULL
    )
    COLLATE='utf8mb4_0900_ai_ci'
    ENGINE=InnoDB
    ;`;
    connection.query(queryCreateUnconditionalMatches, function(err, results) {
        if(err) console.log(err);
        else console.log("Таблица создана unconditional_matches");
    });

    //здесь должны быть ${} с именами INDEX, и таблиц
    const queryCreateBundles = `CREATE TABLE if not exists bundles (
        id CHAR(50) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
        path VARCHAR(255) NOT NULL COLLATE 'utf8mb4_0900_ai_ci',
        stats JSON NULL DEFAULT NULL,
        status_id VARCHAR(255) NOT NULL DEFAULT 'pending' COMMENT 'success | failed | pending' COLLATE 'utf8mb4_0900_ai_ci',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id) USING BTREE
    )
    COLLATE='utf8mb4_0900_ai_ci'
    ENGINE=InnoDB
    `;
    connection.query(queryCreateBundles, function(err, results) {
        if(err) console.log(err);
        else console.log("Таблица создана bundles");
    });

    connection.end();
}

export const setValues = async (table, сolumns, values) => {
    const createConnection = () => {
        return mysql.createConnection({
            host: "database-2.clua1x1ptzge.us-east-1.rds.amazonaws.com",
            user: "admin",
            database: "rts_mysql_base",
            password: "11111111"
        });
    };

    const connection = await createConnection();

    let allColumns = сolumns.join();
    let allValues = values.join();

    const querySet = `INSERT INTO ${table}(${allColumns}) VALUES(${allValues})`;
    connection.query(querySet, function(err, results) {
        if(err) console.log(err);
        console.log(results);
    });   

    connection.end();

}

// export const updateValue = async (table, columns, values) => {
//     const createConnection = () => {
//         return mysql.createConnection({
//             host: "database-2.clua1x1ptzge.us-east-1.rds.amazonaws.com",
//             user: "admin",
//             database: "rts_mysql_base",
//             password: "11111111"
//         });
//     };

//     const connection = await createConnection();

//     let allColumns = сolumns.join();
//     let allValues = values.join();

//     const querySet = `INSERT INTO ${table}(${allColumns}) VALUES(${allValues})`;
//     connection.query(querySet, function(err, results) {
//         if(err) console.log(err);
//         console.log(results);
//     });   

//     connection.end();
// }

//TODO: ф-ия проверки, что нигде пользователь не оставил NULL



//createTables();

// setValues('traittypes', ['title'], ['\'Background\'']);
// setValues('traittypes', ['title'], ['\'Body\'']);
// setValues('traittypes', ['title'], ['\'Face\'']);
// setValues('traittypes', ['title'], ['\'T-shirts\'']);
// setValues('traittypes', ['title'], ['\'Necklace\'']);
// setValues('traittypes', ['title'], ['\'Jacket\'']);
// setValues('traittypes', ['title'], ['\'Hat\'']);
// setValues('traittypes', ['title'], ['\'Googles\'']);
// setValues('traittypes', ['title'], ['\'Mouth\'']);
// setValues('traittypes', ['title'], ['\'Tool\'']);

// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Yellow\'', 16]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Yellow pastel\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Turquoise\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Turquoise pastel\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Red\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Red pastel\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Purple\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Purple pastel\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Orange\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Grey\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Green\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Green pastel\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Brown\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'Black\'', 6]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [1 ,'\'BG-gamer\'', 6]);



// setValues('traits', ['traittype_id', 'title', 'probability'], [2 ,'\'Original\'', 55]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [2 ,'\'Golden\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [2 ,'\'Iced\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [2 ,'\'Royal\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [2 ,'\'Cyberpunk\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [2 ,'\'Original punk\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [2 ,'\'Purple punk\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [2 ,'\'Zombie\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [2 ,'\'Iron hand\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [2 ,'\'Junky\'', 5]);

// setValues('traits', ['traittype_id', 'title', 'probability'], [3 ,'\'Smiling\'', 25]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [3 ,'\'Punk\'', 25]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [3 ,'\'Scarface\'', 25]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [3 ,'\'Cyberpunk\'', 20]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [3 ,'\'Zombie\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [4 ,'\'None\'', 80]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [4 ,'\'Jungle t-shirt\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [4 ,'\'White t-shirt\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [4 ,'\'Gamer t-shirt\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [4 ,'\'Poker t-shirt\'', 5]);

// setValues('traits', ['traittype_id', 'title', 'probability'], [5 ,'\'None\'', 85]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [5 ,'\'Heavy golden chain\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [5 ,'\'Punk silver chain\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [5 ,'\'Near army tokens\'', 5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [6 ,'\'None\'', 72]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [6 ,'\'Jumpsuit\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [6 ,'\'Crazy doc\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [6 ,'\'Jungle shirt\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [6 ,'\'King jacket\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [6 ,'\'Punk jerkin\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [6 ,'\'Punk jacket\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [6 ,'\'Cyberpunk jacket\'', 4]);


// setValues('traits', ['traittype_id', 'title', 'probability'], [7 ,'\'None\'', 72]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [7 ,'\'Snapback\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [7 ,'\'Helmet\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [7 ,'\'Brain\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [7 ,'\'Unicorn cap\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [7 ,'\'Crown\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [7 ,'\'Metal mohawk\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [7 ,'\'Halo\'', 4]);

// setValues('traits', ['traittype_id', 'title', 'probability'], [8 ,'\'None\'', 16]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [8 ,'\'Night-vision\'', 16]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [8 ,'\'Protruding\'', 16]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [8 ,'\'Vipers\'', 16]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [8 ,'\'Original sunglasses \'', 16]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [8 ,'\'All-black sunglasses \'', 16]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [8 ,'\'Cyberpunk\'', 16]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [8 ,'\'VR\'', 16]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [8 ,'\'Hal 9000\'', 16]);


// setValues('traits', ['traittype_id', 'title', 'probability'], [9 ,'\'Iron chin\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [9 ,'\'Hannibal mask\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [9 ,'\'Lollypop\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [9 ,'\'Cigar\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [9 ,'\'Bandana\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [9 ,'\'Respirator\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [9 ,'\'Junky chin\'', 4]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [9 ,'\'None\'', 72]);

// setValues('traits', ['traittype_id', 'title', 'probability'], [10 ,'\'None\'', 95]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [10 ,'\'Rocket Launcher\'', 2.5]);
// setValues('traits', ['traittype_id', 'title', 'probability'], [10 ,'\'Surf\'', 2.5]);

// setValues('conflicts', ['trait_1_id', 'trait_2_id', 'trait_substitute'], [25, 34,1])
// setValues('conflicts', ['trait_1_id', 'trait_2_id', 'trait_substitute'], [25,32 ,1])
// setValues('conflicts', ['trait_1_id', 'trait_2_id', 'trait_substitute'], [25, 28,1])
// setValues('conflicts', ['trait_1_id', 'trait_2_id', 'trait_substitute'], [25,31 ,1])

// setValues('conflicts', ['trait_1_id', 'trait_2_id', 'trait_substitute'], [29,65 ,1])
// setValues('conflicts', ['trait_1_id', 'trait_2_id', 'trait_substitute'], [29,72 ,1])
// setValues('conflicts', ['trait_1_id', 'trait_2_id', 'trait_substitute'], [29,67 ,1])
// setValues('conflicts', ['trait_1_id', 'trait_2_id', 'trait_substitute'], [29,68 ,1])
