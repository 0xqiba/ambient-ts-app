import { useEffect, useState } from 'react';

export interface sectionTermsIF {
    text: string;
    version: number;
    publishedOn: string | Date;
    acceptedOn?: string | Date;
};

export interface termsOfServiceIF {
    transaction: sectionTermsIF,
    chat: sectionTermsIF
}

export const useTermsOfService = () => {
    const tos: sectionTermsIF = {
        text: 'Bacon ipsum dolor amet ham jowl pork belly, venison brisket cow meatloaf ball tip short ribs salami pork chop swine tail sausage. Hamburger doner frankfurter porchetta leberkas, chislic short ribs ribeye jerky ham hock meatball chuck. Frankfurter tail strip steak bacon picanha buffalo cupim venison tongue. Meatball shankle tongue, leberkas short loin sirloin doner pork chop strip steak landjaeger t-bone cow. Prosciutto turkey boudin, pork loin bacon pastrami fatback sirloin cow pork short ribs jerky short loin ground round pork belly. Tri-tip meatloaf spare ribs corned beef chicken. Rump hamburger prosciutto picanha, doner venison shankle meatball alcatra bacon boudin ham kevin.',
        version: 1,
        publishedOn: new Date('05 October 2019 14:48 UTC').toISOString()
    };

    const getCurrentAgreement = (): (sectionTermsIF|undefined) => {
        return JSON.parse(localStorage.getItem('termsOfService') as string);
    };

    const [agreement, setAgreement] = useState<sectionTermsIF|undefined>(
        getCurrentAgreement()
    );

    useEffect(() => {
        agreement && localStorage.setItem('tos', JSON.stringify(agreement));
    }, [agreement]);

    false && agreement;
    false && setAgreement;

    const output = {
        currentToS: () => tos,
        getLastAgreement: () => agreement,
        checkAgreement: () => agreement?.version === tos.version,
        acceptAgreement: () => setAgreement({...tos, acceptedOn: new Date().toISOString()})
    };

    return output;
};
