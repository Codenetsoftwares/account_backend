 const BankServices = {
    userHasAccessToSubAdmin: async (user, subAdminId) => {
        // function userHasAccessToSubAdmin(user, subAdminId) {
        if (user.roles.includes("superAdmin")) {

            return true;
        } else if (user.roles.includes("RequestAdmin")) {
            const authorizedSubadmins = getAuthorizedSubadminsForRequestAdmin(user);
            return authorizedSubadmins.includes(subAdminId);
        }

        return false;
        // }


    },
    getAuthorizedSubadminsForRequestAdmin: async (user) => {
        try {
            let dbBankData = await Bank.find().exec();

            dbBankData = dbBankData.filter(bank => bank.isActive === true);
            console.log('bankd', dbBankData)

            res.status(200).send(dbBankData.subAdminId);
        } catch (e) {
            console.error(e);
            res.status(e.code).send({ message: e.message });
        }
    }


}


export default BankServices;