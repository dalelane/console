import * as React from 'react';
import * as _ from 'lodash';
import { safeDump, safeLoad } from 'js-yaml';
import { FormikValues, useFormikContext } from 'formik';
import { GridItem } from '@patternfly/react-core';
import { coFetchJSON, coFetch } from '@console/internal/co-fetch';
import { DropdownField } from '@console/shared';
import { HelmChartMetaData, HelmRelease } from './helm-types';
import { getChartURL, getChartVersions } from './helm-utils';

export type HelmChartVersionDropdownProps = {
  activeChartVersion: string;
  chartName: string;
};

const HelmChartVersionDropdown: React.FunctionComponent<HelmChartVersionDropdownProps> = ({
  activeChartVersion,
  chartName,
}) => {
  const { setFieldValue } = useFormikContext<FormikValues>();
  const [chartVersion, setChartVersion] = React.useState<string>('');
  const [helmChartVersions, setHelmChartVersions] = React.useState({});
  const [helmChartEntries, setHelmChartEntries] = React.useState<HelmChartMetaData[]>([]);

  React.useEffect(() => {
    let ignore = false;

    const fetchChartVersions = async () => {
      let json: HelmRelease;

      try {
        const response = await coFetch('/api/helm/charts/index.yaml');
        const yaml = await response.text();
        json = safeLoad(yaml);
      } catch {
        if (ignore) return;
      }
      if (ignore) return;
      setHelmChartEntries(_.get(json, ['entries', chartName]));
      setHelmChartVersions(getChartVersions(_.get(json, ['entries', chartName])));
    };
    fetchChartVersions();
    return () => {
      ignore = true;
    };
  }, [chartName]);

  const onChartVersionChange = (value: string) => {
    setChartVersion(value);
    setFieldValue('chartVersion', value);
    const chartURL = getChartURL(helmChartEntries, value);
    setFieldValue('helmChartURL', chartURL);
    const url = getChartURL(helmChartEntries, value);
    coFetchJSON(`/api/helm/chart?url=${url}`)
      .then((res) => {
        setFieldValue('chartValuesYAML', !_.isEmpty(res.values) ? safeDump(res.values) : undefined);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      });
  };

  return (
    <GridItem span={6}>
      <DropdownField
        name="chartVersion"
        label="Chart Version"
        items={helmChartVersions}
        fullWidth
        helpText={'Select the version to upgrade to.'}
        required
        disabled={_.isEmpty(helmChartVersions)}
        title={chartVersion || activeChartVersion}
        onChange={onChartVersionChange}
      />
    </GridItem>
  );
};

export default HelmChartVersionDropdown;
